"""
冒烟测试（无头浏览器）：
验证扫描管线、雾档丢点、强度范围、材质覆盖、线束档位与点云导出。
说明：CI/无头环境用 --disable-gpu 走软件渲染，避免 GPU 进程崩溃（与应用代码无关）。
"""
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

WORKSPACE = Path(r"D:\ccfb\runs\1000146\workspace")
CHROMIUM = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1255\chrome-win64\chrome.exe"
PORT = 5273
BASE = f"http://localhost:{PORT}"


def _is_benign(text: str) -> bool:
    """过滤与应用逻辑无关的资源类噪音。"""
    low = text.lower()
    return "404" in low or "favicon" in low or "failed to load resource" in low


def wait_points(page, expected_min=1, timeout_ms=120000):
    """轮询等待一次扫描完成且产生回波。"""
    deadline = time.time() + timeout_ms / 1000
    while time.time() < deadline:
        try:
            n = page.evaluate(
                "() => window.lidarApp && window.lidarApp.lastResult"
                " ? window.lidarApp.lastResult.points.length : -1"
            )
            if n >= expected_min:
                return n
        except Exception:
            pass
        page.wait_for_timeout(300)
    raise TimeoutError("扫描未在超时内完成")


def main():
    server = subprocess.Popen(
        f"npm run dev -- --port={PORT} --strictPort",
        cwd=WORKSPACE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=True,
    )
    failures = []
    try:
        deadline = time.time() + 30
        while time.time() < deadline:
            try:
                urllib.request.urlopen(BASE, timeout=2)
                break
            except Exception:
                time.sleep(0.5)
        else:
            raise RuntimeError("dev server 未启动")

        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROMIUM,
                headless=True,
                args=[
                    "--disable-gpu",
                    "--enable-unsafe-swiftshader",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            page = browser.new_page(viewport={"width": 1600, "height": 900})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on(
                "console",
                lambda m: errors.append(m.text)
                if m.type == "error" and not _is_benign(m.text)
                else None,
            )
            page.goto(BASE, wait_until="domcontentloaded")

            # 1. 首屏默认扫描：64 线 / 0.2° => 64*1800 = 115200 射线
            wait_points(page)
            rays = page.evaluate("window.lidarApp.rayDirections.length")
            assert rays == 115200, f"默认射线数应为 115200，实际 {rays}"
            stats = page.evaluate("window.lidarApp.lastResult.stats")
            print("默认扫描:", json.dumps(stats, ensure_ascii=False))
            assert stats["fogDropped"] == 0, "晴天不应有雾丢点"
            assert stats["hitCount"] > 5000, "有效回波过少"

            # 2. 强度范围 / 高亮 / 八类材质覆盖
            data = page.evaluate(
                """() => {
                    const pts = window.lidarApp.lastResult.points;
                    const inten = pts.map(p => p.intensity);
                    return {
                        count: pts.length,
                        min: Math.min(...inten),
                        max: Math.max(...inten),
                        highlights: pts.filter(p => p.highlight).length,
                        mats: [...new Set(pts.map(p => p.material))].sort(),
                    };
                }"""
            )
            print("点云数据:", json.dumps(data, ensure_ascii=False))
            assert 0 <= data["min"] <= 1 and 0 <= data["max"] <= 1, "强度越界"
            assert data["max"] > 0.3, "应存在较强回波"
            assert data["highlights"] > 0, "应存在法线近垂直强回波高亮"
            expected = {
                "asphalt", "concrete", "glass", "guardrailMetal",
                "plastic", "signMetal", "vehicleMetal", "vegetation",
            }
            assert set(data["mats"]) == expected, f"材质覆盖不全: {data['mats']}"

            # 3. 雾档：三档消光系数 + 点云逐级变稀
            sigma_ok = page.evaluate(
                """async () => {
                    const mod = await import('/src/materials.ts');
                    const m = mod.WEATHER_MAP;
                    return m.lightFog.extinction === 0.02
                        && m.mediumFog.extinction === 0.08
                        && m.heavyFog.extinction === 0.2
                        && m.clear.extinction === 0;
                }"""
            )
            assert sigma_ok, "三档雾消光系数不匹配"

            counts = {}
            for w in ("lightFog", "mediumFog", "heavyFog"):
                page.evaluate(f"() => window.lidarApp.weather = '{w}'")
                page.evaluate("async () => { await window.lidarApp.scan(); }")
                wait_points(page)
                r = page.evaluate("window.lidarApp.lastResult")
                counts[w] = r["stats"]["hitCount"]
                assert r["stats"]["fogDropped"] > 0, f"{w} 应有雾丢点"
                print(f"{w}: 回波 {r['stats']['hitCount']}，丢点 {r['stats']['fogDropped']}")
            assert counts["lightFog"] > counts["mediumFog"] > counts["heavyFog"], \
                f"点云应随雾浓度逐级变稀: {counts}"

            # 4. 反射率滑块实时重算：沥青反射率 0.12 -> 0.9，平均强度上升
            page.evaluate("() => window.lidarApp.weather = 'clear'")
            page.evaluate("async () => { await window.lidarApp.scan(); }")
            wait_points(page)
            before = page.evaluate(
                """() => {
                    const pts = window.lidarApp.lastResult.points.filter(p => p.material === 'asphalt');
                    return pts.reduce((s, p) => s + p.intensity, 0) / pts.length;
                }"""
            )
            page.evaluate(
                """() => {
                    window.lidarApp.materialParams.asphalt.reflectance = 0.9;
                }"""
            )
            page.evaluate("async () => { await window.lidarApp.scan(); }")
            wait_points(page)
            after = page.evaluate(
                """() => {
                    const pts = window.lidarApp.lastResult.points.filter(p => p.material === 'asphalt');
                    return pts.reduce((s, p) => s + p.intensity, 0) / pts.length;
                }"""
            )
            print(f"沥青平均强度: {before:.4f} -> {after:.4f}")
            assert after > before, "提高反射率后强度应上升"

            # 5. 128 线 / 0.1° 档位
            page.evaluate(
                """async () => {
                    const { buildRayDirections } = await import('/src/scanner.ts');
                    const cfg = window.lidarApp.scanConfig;
                    cfg.channels = 128;
                    cfg.horizontalResolutionDeg = 0.1;
                    window.lidarApp.rayDirections = buildRayDirections(cfg);
                    await window.lidarApp.scan();
                }"""
            )
            wait_points(page)
            rays = page.evaluate("window.lidarApp.rayDirections.length")
            assert rays == 460800, f"128线/0.1° 射线数应为 460800，实际 {rays}"
            print("128线/0.1°: 射线", rays, "回波",
                  page.evaluate("window.lidarApp.lastResult.stats.hitCount"))

            # 6. 导出：文件名带线束数与雾档，内容为 xyz+intensity 四列
            with page.expect_download() as dl_info:
                page.evaluate(
                    """() => {
                        window.lidarApp.weather = 'mediumFog';
                        window.lidarApp.exportCloud();
                    }"""
                )
            download = dl_info.value
            name = download.suggested_filename
            assert name.startswith("lidar_128ch_"), f"文件名应带线束数: {name}"
            assert "mediumFog" in name, f"文件名应带雾档: {name}"
            assert name.endswith(".txt"), f"应为 txt: {name}"
            tmp = WORKSPACE / "tests" / name
            download.save_as(str(tmp))
            content = tmp.read_text(encoding="utf-8")
            data_lines = [ln for ln in content.splitlines() if ln and not ln.startswith("#")]
            assert data_lines, "导出无数据行"
            cols = data_lines[0].split()
            assert len(cols) == 4, f"每行应为 x y z intensity 四列: {data_lines[0]}"
            [float(x) for x in cols]
            assert "# columns: x y z intensity" in content
            print("导出校验通过:", name, f"({len(data_lines)} 行)")
            tmp.unlink()

            if errors:
                failures.append(f"浏览器控制台错误: {errors[:5]}")
            try:
                browser.close()
            except Exception:
                # 无头软件渲染下关闭阶段偶发进程退出，不影响已完成的断言
                pass
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()

    if failures:
        print("FAIL:", failures)
        sys.exit(1)
    print("\n全部冒烟测试通过 ✔")


if __name__ == "__main__":
    main()

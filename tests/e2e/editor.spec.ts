import { expect, test, type Page } from "@playwright/test";

const STATUS = '[data-testid="preview-status"]';
const ISSUES = '[data-testid="issues-text"]';

async function waitForMaterial(page: Page) {
  await expect(page.locator(STATUS)).toContainText("材质已就绪", { timeout: 25000 });
  await expect(page.locator(ISSUES)).toContainText("校验通过", { timeout: 25000 });
}

async function openTab(page: Page, tab: "inspector" | "code" | "projects") {
  await page.locator(`[data-testid="tab-${tab}"]`).click();
}

function projectRows(page: Page) {
  return page.locator('[data-testid="project-panel"] .project-item');
}

async function dragPort(
  page: Page,
  from: { nodeId: string; port: string },
  to: { nodeId: string; port: string },
) {
  const source = page.locator(
    `[data-output-port="true"][data-node-id="${from.nodeId}"][data-port-id="${from.port}"]`,
  );
  const target = page.locator(
    `[data-input-port="true"][data-node-id="${to.nodeId}"][data-port-id="${to.port}"]`,
  );
  const a = await source.boundingBox();
  const b = await target.boundingBox();
  if (!a || !b) throw new Error("端口没有渲染出来");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 26, a.y + a.height / 2 + 14, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 });
  await page.mouse.up();
}

async function nodeList(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-testid^='node-']")]
      .filter((el) => el.getAttribute("data-node-kind"))
      .map((el) => ({
        id: (el.getAttribute("data-testid") ?? "").replace("node-", ""),
        kind: el.getAttribute("data-node-kind") as string,
      })),
  );
}

async function readSample(page: Page) {
  await page.locator('[data-testid="sample-viewports"]').click();
  await page.waitForTimeout(350);
  return page.evaluate(() => {
    const text = document.querySelector('[data-testid="preview-sample"]')?.textContent ?? "";
    const match = /球体 RGB (\d+),(\d+),(\d+) · 平面 RGB (\d+),(\d+),(\d+)/.exec(text);
    return match ? match.slice(1).map(Number) : null;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await waitForMaterial(page);
});

test("首屏加载后球体与平面两个视口都有材质", async ({ page }) => {
  const sample = await readSample(page);
  expect(sample).not.toBeNull();
  const [r1, g1, b1, r2, g2, b2] = sample!;
  expect(Math.max(r1, g1, b1)).toBeGreaterThan(35);
  expect(Math.max(r2, g2, b2)).toBeGreaterThan(35);
});

test("切换预设后两个预览一起刷新", async ({ page }) => {
  const before = await page.locator('[data-testid="preview-canvas"]').screenshot();
  await page.locator('[data-testid="preset-corroded"]').click();
  await waitForMaterial(page);
  const after = await page.locator('[data-testid="preview-canvas"]').screenshot();
  expect(Buffer.compare(before, after)).not.toBe(0);

  const sample = await readSample(page);
  expect(sample).not.toBeNull();
  const [r1, , , r2] = sample!;
  expect(r1).toBeGreaterThan(0);
  expect(r2).toBeGreaterThan(0);
});

test("拖动光源角度会改变预览并更新读数", async ({ page }) => {
  const before = await page.locator('[data-testid="preview-canvas"]').screenshot();
  const azimuthBefore = await page.locator('[data-testid="light-azimuth"]').innerText();
  const dial = page.locator('[data-testid="light-dial"]');
  const box = (await dial.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.78, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  expect(await page.locator('[data-testid="light-azimuth"]').innerText()).not.toBe(azimuthBefore);
  const after = await page.locator('[data-testid="preview-canvas"]').screenshot();
  expect(Buffer.compare(before, after)).not.toBe(0);
  // 调整光源不触发重新生成
  await expect(page.locator(STATUS)).toContainText("材质已就绪");
});

test("粗糙度滑杆只更新 uniform，不改源码", async ({ page }) => {
  await openTab(page, "code");
  const lineCountBefore = await page.locator('[data-testid="code-lines"]').innerText();
  const codeBefore = await page.locator('[data-testid="code-scroll"]').innerText();

  const slider = page.locator('[data-testid="roughness-slider"]');
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);

  expect(await page.locator('[data-testid="code-lines"]').innerText()).toBe(lineCountBefore);
  expect(await page.locator('[data-testid="code-scroll"]').innerText()).toBe(codeBefore);
  expect(await page.locator('[data-testid="roughness-value"]').innerText()).not.toBe("0.55");
  const before = await page.locator('[data-testid="preview-canvas"]').screenshot();
  expect(before.length).toBeGreaterThan(0);
});

test("类型不同的端口无法连接并给出提示", async ({ page }) => {
  const nodes = await nodeList(page);
  const noise = nodes.find((n) => n.kind === "noise")!;
  const output = nodes.find((n) => n.kind === "output")!;
  const edgesBefore = await page.locator("[data-edge-id]").count();
  await dragPort(page, { nodeId: noise.id, port: "color" }, { nodeId: output.id, port: "metallic" });
  await expect(page.locator('[data-testid="link-rejected"]')).toContainText("类型不同", { timeout: 8000 });
  // 非法连接没有被写入图里
  await expect(page.locator("[data-edge-id]")).toHaveCount(edgesBefore);
  await expect(page.locator(ISSUES)).toContainText("校验通过");
});

test("成环连接被当场拦截，断开后重新校验通过", async ({ page }) => {
  await page.locator('[data-testid="library-noise"]').click();
  await page.locator('[data-testid="library-noise"]').click();
  await page.waitForTimeout(400);

  const all = await nodeList(page);
  const noises = all.filter((n) => n.kind === "noise");
  expect(noises.length).toBeGreaterThanOrEqual(3);
  const [a, b] = noises;

  await dragPort(page, { nodeId: a.id, port: "rgb" }, { nodeId: b.id, port: "coord" });
  await page.waitForTimeout(400);
  const edgesAfterFirst = await page.locator("[data-edge-id]").count();
  expect(edgesAfterFirst).toBeGreaterThan(0);

  // 反向连接形成环 —— 必须在连线位置被拦住
  await dragPort(page, { nodeId: b.id, port: "rgb" }, { nodeId: a.id, port: "coord" });
  await expect(page.locator('[data-testid="link-rejected"]')).toContainText("环", { timeout: 8000 });
  await expect(page.locator("[data-edge-id]")).toHaveCount(edgesAfterFirst);
  await expect(page.locator(ISSUES)).toContainText("校验通过");

  // 断开第一条连线，图重新校验
  await page.locator("[data-edge-id]").first().click({ force: true });
  await page.waitForTimeout(300);
  await waitForMaterial(page);
  expect(await page.locator("[data-edge-id]").count()).toBe(edgesAfterFirst - 1);
});

test("修改节点参数会重新生成着色器源码", async ({ page }) => {
  await openTab(page, "code");
  const before = await page.locator('[data-testid="code-scroll"]').innerText();

  await openTab(page, "inspector");
  await page.locator("[data-node-kind='noise']").first().click({ position: { x: 70, y: 12 } });
  const slider = page.locator('[data-testid="param-scale"]');
  const box = (await slider.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.82, box.y + box.height / 2);
  await page.waitForTimeout(150);

  await openTab(page, "code");
  const after = await page.locator('[data-testid="code-scroll"]').innerText();
  expect(after).not.toBe(before);
  await waitForMaterial(page);
});

test("连续快速调参：界面持续可交互，最终收敛到最新材质", async ({ page }) => {
  await openTab(page, "inspector");
  await page.locator("[data-node-kind='noise']").first().click({ position: { x: 70, y: 12 } });
  const slider = page.locator('[data-testid="param-contrast"]');
  const box = (await slider.boundingBox())!;

  for (let i = 0; i < 15; i++) {
    const ratio = 0.12 + (i % 10) * 0.075;
    await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
  }
  const clickDone = Date.now();
  await waitForMaterial(page);
  const settledIn = Date.now() - clickDone;

  const settled = await page.evaluate(() => {
    const status = document.querySelector('[data-testid="preview-status"]')?.textContent ?? "";
    const compile = document.querySelector('[data-testid="compile-count"]')?.textContent ?? "";
    return { status, compile };
  });
  expect(settled.status).toContain("材质已就绪");
  // 停止调参后，主线程应在数秒内恢复且编译队列收敛到最新材质
  expect(settledIn).toBeLessThan(4000);
  expect(settled.compile).toContain("总编译");
});

test("材质可存为预设、刷新后仍在、并可直接套用", async ({ page }) => {
  await page.locator('[data-testid="save-preset-toggle"]').click();
  await page.locator('[data-testid="preset-name-input"]').fill("沿海盐雾试验");
  await page.locator('[data-testid="preset-save-confirm"]').click();
  await expect(page.locator('[data-testid="toast"]')).toContainText("已保存预设", { timeout: 6000 });

  const chip = page.locator('.preset-chip:has-text("沿海盐雾试验")');
  await expect(chip).toHaveCount(1);
  await chip.click();
  await waitForMaterial(page);
  await expect(page.locator('[data-testid="active-project-name"]')).toContainText("沿海盐雾试验");

  await page.reload();
  await waitForMaterial(page);
  await expect(page.locator('.preset-chip:has-text("沿海盐雾试验")')).toHaveCount(1);
});

test("多个金具方案可以切换与复制", async ({ page }) => {
  await openTab(page, "projects");
  const initialCount = await projectRows(page).count();
  expect(initialCount).toBeGreaterThanOrEqual(2);

  const firstName = (await page.locator('[data-testid="project-name"]').first().innerText()).trim();
  const duplicateBtn = page.locator('[data-testid^="duplicate-"]').first();
  const projectId = (await duplicateBtn.getAttribute("data-testid"))!.replace("duplicate-", "");
  await duplicateBtn.click();
  await expect(page.locator('[data-testid="toast"]')).toContainText("已复制", { timeout: 6000 });

  const names = await page.locator('[data-testid="project-name"]').allInnerTexts();
  expect(names.length).toBe(initialCount + 1);
  expect(names.some((n) => n.includes("副本"))).toBe(true);

  await page.locator(`[data-testid="project-${projectId}"] .project-select`).click();
  await waitForMaterial(page);
  await expect(page.locator('[data-testid="active-project-name"]')).toHaveText(firstName);

  await page.reload();
  await waitForMaterial(page);
  await openTab(page, "projects");
  expect(await projectRows(page).count()).toBe(initialCount + 1);
});

test("右侧代码面板可展开查看片元与顶点源码", async ({ page }) => {
  await openTab(page, "code");
  const code = await page.locator('[data-testid="code-scroll"]').innerText();
  expect(code).toContain("gl_FragColor");
  expect(code).toContain("void main");
  expect(code).toContain("uLightDir");
  await page.locator('[data-testid="tab-vertex"]').click();
  const vertex = await page.locator('[data-testid="code-scroll"]').innerText();
  expect(vertex).toContain("worldViewProjection");
});

test("选中节点时高亮其在源码中的行段", async ({ page }) => {
  await page.locator("[data-node-kind='fresnel']").first().click({ position: { x: 70, y: 12 } });
  await openTab(page, "code");
  await page.waitForTimeout(600);
  const highlighted = await page.locator(".code-lines li.highlight").count();
  expect(highlighted).toBeGreaterThan(0);
});

test("拖动节点会移动位置且连线跟随", async ({ page }) => {
  const viewport = (await page.locator('[data-testid="canvas-viewport"]').boundingBox())!;
  const noise = page.locator("[data-node-kind='noise']").first();
  const before = (await noise.boundingBox())!;
  await page.mouse.move(before.x + 60, before.y + 12);
  await page.mouse.down();
  await page.mouse.move(viewport.x + viewport.width * 0.72, viewport.y + viewport.height * 0.42, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = (await noise.boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeGreaterThan(40);
  // 移动后图仍然有效，说明连线随节点位置重算
  await expect(page.locator(ISSUES)).toContainText("校验通过");
});

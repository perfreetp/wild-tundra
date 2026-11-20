// 状态导入/校验逻辑测试(纯逻辑,Node 直接运行)
import { sanitize, importState, sectionState } from "../src/lib/state";
import { get } from "svelte/store";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

// 1. 合法状态原样保留
const valid = {
  clipHeight: 66.5,
  direction: "vertical",
  clipAngle: 120,
  viewMode: "top",
  camera: { alpha: 1, beta: 0.5, radius: 200, target: [1, 2, 3] },
  selectedFloorId: "T1-F03",
};
const s1 = sanitize(valid);
check("valid state preserved", JSON.stringify(s1) === JSON.stringify(valid));

// 2. 越界与非法值被钳制/回退
const s2 = sanitize({
  clipHeight: 999,
  direction: "diagonal",
  clipAngle: -5,
  viewMode: "fly",
  camera: "junk",
  selectedFloorId: 42,
});
check(
  "invalid values sanitized",
  s2.clipHeight === 120 && s2.direction === "horizontal" && s2.clipAngle === 0 &&
    s2.viewMode === "orbit" && s2.camera === null && s2.selectedFloorId === null,
);

// 3. 导入导出形状的 JSON(带 state 包装)
const err1 = importState(JSON.stringify({ app: "x", version: 1, state: valid }));
check("import wrapped state", err1 === null);
const st = get(sectionState);
check("store updated", st.clipHeight === 66.5 && st.direction === "vertical" && st.camera?.radius === 200);

// 4. 裸状态对象也可导入
const err2 = importState(JSON.stringify({ clipHeight: 10, direction: "horizontal", clipAngle: 0, viewMode: "orbit", camera: null, selectedFloorId: null }));
check("import bare state", err2 === null && get(sectionState).clipHeight === 10);

// 5. 坏 JSON 返回错误而不抛异常
const err3 = importState("{not json");
check("bad json returns error", typeof err3 === "string" && err3.length > 0);

// 6. 非对象输入回退默认值
const s6 = sanitize(null);
check("null input -> defaults", s6.clipHeight === 40 && s6.direction === "horizontal");

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

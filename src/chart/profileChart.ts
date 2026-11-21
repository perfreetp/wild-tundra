import type { Corridor } from "../core/corridor";
import { clamp } from "../core/math";
import { TRACK } from "../core/types";

export interface ProfileViewState {
  hoveredId: string | null;
  selectedId: string | null;
  showGround: boolean;
  /** 竖轴放大倍数 */
  exaggeration: number;
}

export interface ProfileViewCallbacks {
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDragStart: (id: string) => void;
  onDrag: (id: string, s: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

interface Bounds {
  s0: number;
  s1: number;
  y0: number;
  y1: number;
}

const PAD = { left: 62, right: 18, top: 30, bottom: 40 };
const HANDLE_R = 7;

export class ProfileChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private corridor: Corridor | null = null;
  private ground: { s: number; y: number }[] = [];
  private state: ProfileViewState = {
    hoveredId: null,
    selectedId: null,
    showGround: true,
    exaggeration: 1,
  };
  private cb: ProfileViewCallbacks;
  private dragId: string | null = null;
  private hoverId: string | null = null;
  private bounds: Bounds = { s0: 0, s1: 1, y0: 0, y1: 1 };
  private dpr = 1;
  private ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, cb: ProfileViewCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.cb = cb;
    this.cdpr();
    this.installEvents();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
  }

  private cdpr() {
    this.dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.cdpr();
    // 用父容器的内容盒尺寸，避免 canvas 自身尺寸反过来撑大父容器
    const rect = parent.getBoundingClientRect();
    const style = window.getComputedStyle(parent);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const w = Math.max(120, Math.floor(rect.width - padX));
    const h = Math.max(88, Math.floor(rect.height - padY));
    const bw = Math.floor(w * this.dpr);
    const bh = Math.floor(h * this.dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.draw();
  }

  setData(corridor: Corridor, ground: { s: number; y: number }[]) {
    const hadData = !!this.corridor;
    this.corridor = corridor;
    this.ground = ground;
    if (!this.dragId || !hadData) this.computeBounds();
    this.draw();
  }

  setState(patch: Partial<ProfileViewState>) {
    const priorExag = this.state.exaggeration;
    Object.assign(this.state, patch);
    if (patch.exaggeration !== undefined && patch.exaggeration !== priorExag) {
      this.computeBounds();
    }
    this.draw();
  }

  setHover(id: string | null) {
    if (this.hoverId === id) return;
    this.hoverId = id;
    this.state.hoveredId = id;
    this.draw();
  }

  private computeBounds() {
    const c = this.corridor;
    if (!c) return;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const p of c.profile.points) {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    }
    for (const g of this.ground) {
      yMin = Math.min(yMin, g.y);
      yMax = Math.max(yMax, g.y);
    }
    if (!Number.isFinite(yMin)) {
      yMin = 0;
      yMax = 1;
    }
    const span = Math.max(yMax - yMin, 2);
    const mid = (yMin + yMax) / 2;
    // exaggeration > 1 时缩小竖向范围，让坡度变化更明显
    const half = (span / 2) * 1.22 / Math.max(0.25, this.state.exaggeration);
    this.bounds = { s0: 0, s1: Math.max(c.plan.length, 10), y0: mid - half, y1: mid + half };
  }

  private plotRect() {
    const cssW = this.canvas.width / this.dpr;
    const cssH = this.canvas.height / this.dpr;
    return {
      x: PAD.left, y: PAD.top,
      w: Math.max(10, cssW - PAD.left - PAD.right),
      h: Math.max(10, cssH - PAD.top - PAD.bottom),
      cssW, cssH,
    };
  }

  private toScreen(s: number, y: number) {
    const r = this.plotRect();
    const x = r.x + ((s - this.bounds.s0) / (this.bounds.s1 - this.bounds.s0)) * r.w;
    const yy = r.y + (1 - (y - this.bounds.y0) / (this.bounds.y1 - this.bounds.y0)) * r.h;
    return { x, y: yy };
  }

  private fromScreen(px: number, py: number) {
    const r = this.plotRect();
    const s = this.bounds.s0 + ((px - r.x) / r.w) * (this.bounds.s1 - this.bounds.s0);
    const y = this.bounds.y0 + (1 - (py - r.y) / r.h) * (this.bounds.y1 - this.bounds.y0);
    return { s, y };
  }

  private handleAt(px: number, py: number): string | null {
    const c = this.corridor;
    if (!c) return null;
    let best: string | null = null;
    let bestD = HANDLE_R + 5;
    for (const p of c.profile.points) {
      const sp = this.toScreen(p.s, p.y);
      const d = Math.hypot(sp.x - px, sp.y - py);
      if (d < bestD) {
        bestD = d;
        best = p.id;
      }
    }
    return best;
  }

  private installEvents() {
    const cv = this.canvas;
    const local = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    cv.addEventListener("pointerdown", (e) => {
      const { x, y } = local(e);
      const id = this.handleAt(x, y);
      if (id) {
        this.dragId = id;
        this.cb.onDragStart(id);
        this.cb.onSelect(id);
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = "grabbing";
        e.preventDefault();
      } else {
        this.cb.onSelect(null);
      }
    });
    cv.addEventListener("pointermove", (e) => {
      const { x, y } = local(e);
      if (this.dragId) {
        const c = this.corridor;
        if (c) {
          const idx = c.profile.points.findIndex((p) => p.id === this.dragId);
          const pt = c.profile.points[idx];
          if (!pt) return;
          const world = this.fromScreen(x, y);
          // 端点锁定里程、内点可沿里程移动
          const total = c.plan.length;
          let s = world.s;
          if (idx === 0) s = c.profile.points[0].s;
          else if (idx === c.profile.points.length - 1) s = total;
          else {
            const prev = c.profile.points[idx - 1].s + 8;
            const next = c.profile.points[idx + 1].s - 8;
            s = clamp(s, Math.min(prev, next), Math.max(prev, next));
          }
          this.cb.onDrag(pt.id, s, world.y);
        }
        return;
      }
      const id = this.handleAt(x, y);
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.cb.onHover(id);
        cv.style.cursor = id ? "grab" : "crosshair";
        this.draw();
      }
    });
    const end = (e: PointerEvent) => {
      if (!this.dragId) return;
      const id = this.dragId;
      this.dragId = null;
      this.cb.onDragEnd(id);
      cv.style.cursor = "crosshair";
      try { cv.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("pointerleave", () => {
      if (!this.dragId && this.hoverId) {
        this.hoverId = null;
        this.cb.onHover(null);
        this.draw();
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const c = this.corridor;
    const r = this.plotRect();
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.cssW, r.cssH);
    if (!c || c.profile.points.length === 0) return;

    // 背景
    ctx.fillStyle = "rgba(14,19,26,0.55)";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    this.drawGrid(ctx, r);
    this.drawFillCutBands(ctx, r);
    if (this.state.showGround) this.drawGround(ctx, r);
    this.drawAlignment(ctx, r);
    this.drawGradeLabels(ctx, r);
    this.drawHandles(ctx);
    this.drawAxis(ctx, r);
    this.drawLegend(ctx, r);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    const b = this.bounds;
    ctx.save();
    ctx.strokeStyle = "rgba(126,150,180,0.12)";
    ctx.lineWidth = 1;
    ctx.font = "10px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillStyle = "rgba(150,172,200,0.55)";
    // 高程网格
    const ySpan = b.y1 - b.y0;
    const stepChoices = [1, 2, 5, 10, 20, 25, 50, 100];
    let step = 10;
    for (const sc of stepChoices) {
      if (ySpan / sc <= 7) { step = sc; break; }
    }
    for (let y = Math.ceil(b.y0 / step) * step; y <= b.y1; y += step) {
      const p = this.toScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(r.x, Math.round(p.y) + 0.5);
      ctx.lineTo(r.x + r.w, Math.round(p.y) + 0.5);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${y.toFixed(0)}`, r.x - 8, p.y);
    }
    // 里程网格
    const total = b.s1 - b.s0;
    const sSteps = [50, 100, 200, 250, 500, 1000];
    let sStep = 100;
    for (const sc of sSteps) {
      if (total / sc <= 9) { sStep = sc; break; }
    }
    for (let s = Math.ceil(b.s0 / sStep) * sStep; s <= b.s1; s += sStep) {
      const p = this.toScreen(s, b.y0);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(126,150,180,0.09)";
      ctx.moveTo(Math.round(p.x) + 0.5, r.y);
      ctx.lineTo(Math.round(p.x) + 0.5, r.y + r.h);
      ctx.stroke();
      ctx.fillStyle = "rgba(150,172,200,0.62)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(formatKm(s), p.x, r.y + r.h + 8);
    }
    // 单位说明
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(150,172,200,0.45)";
    ctx.fillText("高程 / m", r.x, r.y - 10);
    ctx.restore();
  }

  /** 设计线与地面之间的填/挖着色 */
  private drawFillCutBands(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    const c = this.corridor!;
    const groundFn = this.groundInterp();
    if (!groundFn) return;
    const stepPx = 4;
    ctx.save();
    for (let px = 0; px <= r.w; px += stepPx) {
      const s = this.bounds.s0 + (px / r.w) * (this.bounds.s1 - this.bounds.s0);
      if (s < 0 || s > c.plan.length) continue;
      // 道床顶面
      const designY = c.profile.evalY(s) - TRACK.railToFormation + TRACK.ballastHeight;
      const g = groundFn(s);
      const diff = designY - g;
      if (Math.abs(diff) < 0.05) continue;
      const pA = this.toScreen(s, designY);
      const pB = this.toScreen(s, g);
      ctx.fillStyle = diff > 0 ? "rgba(196,140,62,0.30)" : "rgba(64,138,152,0.30)";
      ctx.fillRect(pA.x, Math.min(pA.y, pB.y), stepPx + 0.5, Math.abs(pB.y - pA.y));
    }
    ctx.restore();
  }

  private groundInterp(): ((s: number) => number) | null {
    if (this.ground.length < 2) return null;
    const arr = this.ground;
    return (s: number) => {
      if (s <= arr[0].s) return arr[0].y;
      if (s >= arr[arr.length - 1].s) return arr[arr.length - 1].y;
      let lo = 0;
      let hi = arr.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].s < s) lo = mid + 1;
        else hi = mid;
      }
      const b = arr[lo];
      const a = arr[lo - 1];
      const t = (s - a.s) / Math.max(b.s - a.s, 1e-6);
      return a.y + (b.y - a.y) * t;
    };
  }

  private drawGround(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    const arr = this.ground;
    if (arr.length < 2) return;
    ctx.save();
    ctx.beginPath();
    const p0 = this.toScreen(arr[0].s, arr[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (const g of arr) {
      const p = this.toScreen(g.s, g.y);
      ctx.lineTo(p.x, p.y);
    }
    const last = this.toScreen(arr[arr.length - 1].s, this.bounds.y0);
    const first = this.toScreen(arr[0].s, this.bounds.y0);
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(first.x, first.y);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    grad.addColorStop(0, "rgba(96,104,88,0.16)");
    grad.addColorStop(1, "rgba(96,104,88,0.04)");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    for (const g of arr) {
      const p = this.toScreen(g.s, g.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(154,158,128,0.72)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    void r;
  }

  private drawAlignment(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    const c = this.corridor!;
    const pts = c.profile.points;
    ctx.save();
    // 设计线（轨顶）
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = this.toScreen(pts[i].s, pts[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "#f0b445";
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(240,180,69,0.55)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 坡段矢量线 + 坡度标注
    ctx.font = "600 10.5px 'JetBrains Mono', ui-monospace, monospace";
    for (const seg of c.profile.segments) {
      const a = this.toScreen(seg.s0, seg.y0);
      const b = this.toScreen(seg.s1, seg.y1);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const grade = seg.grade * 100;
      const label = `${grade >= 0 ? "+" : ""}${grade.toFixed(1)}‰`.replace("%", "‰");
      const gradePermille = seg.grade * 1000;
      const txt = `${gradePermille >= 0 ? "+" : ""}${gradePermille.toFixed(0)}‰`;
      const isMax = Math.abs(seg.grade) === Math.abs(c.profile.maxGrade) && c.profile.maxGrade !== 0;
      ctx.fillStyle = isMax ? "rgba(255,120,96,0.98)" : "rgba(196,212,232,0.72)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const w = ctx.measureText(txt).width;
      if (w < Math.abs(b.x - a.x) - 6) {
        ctx.fillText(txt, midX, midY - 6);
      }
      void label;
    }
    // 最大坡度标记：在坡段中点画三角 + 文字
    const maxSeg = c.profile.segments[c.profile.maxGradeSegment];
    if (maxSeg && Math.abs(c.profile.maxGrade) > 0.0001) {
      const midS = (maxSeg.s0 + maxSeg.s1) / 2;
      const midYw = (maxSeg.y0 + maxSeg.y1) / 2;
      const p = this.toScreen(midS, midYw);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,110,88,0.85)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,120,96,0.98)";
      ctx.font = "700 10.5px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`最大坡度 ${(c.profile.maxGrade * 1000).toFixed(1)}‰`, p.x, p.y - 18);
    }
    // 坡度变化点
    for (const p of pts) {
      const sp = this.toScreen(p.s, p.y);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,236,190,0.95)";
      ctx.fill();
    }
    ctx.restore();
    void r;
  }

  private drawGradeLabels(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    // 坡度变化点（变坡点）用细竖线连接到轴
    const c = this.corridor!;
    ctx.save();
    ctx.strokeStyle = "rgba(240,180,69,0.14)";
    ctx.setLineDash([2, 4]);
    for (const p of c.profile.points) {
      const sp = this.toScreen(p.s, p.y);
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x, r.y + r.h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawHandles(ctx: CanvasRenderingContext2D) {
    const c = this.corridor!;
    for (const p of c.profile.points) {
      const sp = this.toScreen(p.s, p.y);
      const active = p.id === this.state.selectedId;
      const hover = p.id === this.state.hoveredId;
      const rad = active ? HANDLE_R + 2 : hover ? HANDLE_R + 1 : HANDLE_R;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = active
        ? "rgba(255,214,102,0.98)"
        : hover
        ? "rgba(255,236,176,0.95)"
        : "rgba(18,26,36,0.95)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = active ? "#ffd666" : "rgba(240,180,69,0.9)";
      ctx.stroke();
      if (active || hover) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rad + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,214,102,0.28)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private drawAxis(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    ctx.save();
    ctx.strokeStyle = "rgba(160,180,204,0.26)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h + 0.5);
    ctx.lineTo(r.x + r.w, r.y + r.h + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  private drawLegend(ctx: CanvasRenderingContext2D, r: ReturnType<ProfileChart["plotRect"]>) {
    const items: { c: string; t: string; dash?: boolean }[] = [
      { c: "#f0b445", t: "轨顶设计线" },
      { c: "rgba(154,158,128,0.9)", t: "地面线", dash: true },
      { c: "rgba(196,140,62,0.85)", t: "填方" },
      { c: "rgba(64,138,152,0.85)", t: "挖方" },
    ];
    ctx.save();
    ctx.font = "10.5px 'Segoe UI', system-ui, sans-serif";
    let x = r.x + r.w - 4;
    ctx.textAlign = "right";
    // 图例放到底部轴上方，避免与顶部工具栏重叠
    const y = r.y + r.h - 8;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const tw = ctx.measureText(it.t).width;
      ctx.fillStyle = "rgba(178,196,218,0.72)";
      ctx.fillText(it.t, x, y);
      x -= tw + 8;
      ctx.beginPath();
      if (it.dash) {
        ctx.setLineDash([4, 3]);
        ctx.moveTo(x, y - 3.5);
        ctx.lineTo(x + 12, y - 3.5);
        ctx.setLineDash([]);
      } else {
        ctx.moveTo(x + 2, y - 3.5);
        ctx.lineTo(x + 14, y - 3.5);
      }
      ctx.strokeStyle = it.c;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      x -= 20;
    }
    ctx.restore();
    void r;
  }

  dispose() {
    this.ro?.disconnect();
  }
}

function formatKm(s: number) {
  const km = Math.floor(s / 1000);
  const m = Math.round(s % 1000);
  return `K${km}+${String(m).padStart(3, "0")}`;
}

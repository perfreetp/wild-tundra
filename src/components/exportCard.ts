import { store } from '../state/store';
import { TILE_COLORS } from '../state/colors';
import type { BabylonScene } from '../babylon/scene';

/**
 * 生成搭法卡片:把 Babylon 截图 + 拼搭信息合成为一张 PNG 并下载。
 */
export async function exportBuildCard(scene: BabylonScene | null): Promise<void> {
  if (!scene) return;
  const snapshot = store.snapshot();
  const screenshot = scene.captureDataUrl();

  const W = 720;
  const H = 980;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fff9ec');
  bg.addColorStop(1, '#ffe8cc');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.fillStyle = '#5c3a1e';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('我的磁力片作品', W / 2, 78);

  // 截图区域(圆角)
  const imgX = 50;
  const imgY = 120;
  const imgW = W - 100;
  const imgH = 560;
  ctx.save();
  roundedRect(ctx, imgX, imgY, imgW, imgH, 28);
  ctx.clip();
  ctx.fillStyle = '#fdf6ec';
  ctx.fillRect(imgX, imgY, imgW, imgH);
  const img = await loadImage(screenshot);
  // 等比 cover 绘制
  drawCover(ctx, img, imgX, imgY, imgW, imgH);
  ctx.restore();
  ctx.strokeStyle = '#f0c188';
  ctx.lineWidth = 4;
  roundedRect(ctx, imgX, imgY, imgW, imgH, 28);
  ctx.stroke();

  // 统计信息
  const counts = countKinds(snapshot.tiles.map((t) => t.kind));
  let y = 740;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7a4a1e';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`用了 ${snapshot.tiles.length} 片磁力片`, 60, y);
  ctx.fillStyle = '#a56a2a';
  ctx.font = '26px system-ui, sans-serif';
  y += 46;
  const parts = Object.entries(counts).map(([kind, n]) => `${TILE_COLORS[kind].name} × ${n}`);
  ctx.fillText(parts.join('   '), 60, y);
  y += 46;
  ctx.fillText(`连接 ${snapshot.conns.length} 处 · 操作 ${store.historyCount()} 步`, 60, y);

  // 底部小贴纸
  ctx.textAlign = 'center';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = '#c47d2e';
  ctx.fillText(new Date().toLocaleDateString('zh-CN'), W / 2, H - 50);

  // 下载
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `磁力片作品-${Date.now()}.png`;
  a.click();
}

function countKinds(kinds: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of kinds) out[k] = (out[k] ?? 0) + 1;
  return out;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const br = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = img.height * br;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / br;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

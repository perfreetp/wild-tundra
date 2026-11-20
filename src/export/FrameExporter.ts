/**
 * 导出模块：按固定帧间隔把画面导出为 PNG 序列帧，
 * 文件名携带帧序号与曝光值，如 frame_000123_ev+2.35.png。
 * 支持 File System Access API 直接写入目录，否则回退为逐帧下载。
 */
export class FrameExporter {
  exporting = false;
  /** 每隔多少帧导出一帧 */
  interval = 10;
  savedCount = 0;

  private frameIndex = 0;
  private dir: any = null;

  get hasDirectory(): boolean {
    return this.dir != null;
  }

  static get directoryPickerSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  async pickDirectory(): Promise<boolean> {
    const picker = (window as any).showDirectoryPicker;
    if (!picker) return false;
    try {
      this.dir = await picker.call(window, { mode: 'readwrite' });
      return true;
    } catch {
      return false; // 用户取消
    }
  }

  reset(): void {
    this.frameIndex = 0;
    this.savedCount = 0;
  }

  /** 每帧调用；到达间隔时抓取画布并保存，返回是否导出了本帧 */
  async maybeCapture(canvas: HTMLCanvasElement, ev: number): Promise<boolean> {
    if (!this.exporting) return false;
    if (this.frameIndex++ % this.interval !== 0) return false;

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) return false;

    const name = `frame_${String(this.savedCount).padStart(6, '0')}_ev${ev >= 0 ? '+' : '-'}${Math.abs(ev).toFixed(2)}.png`;
    if (this.dir) {
      try {
        const fh = await this.dir.getFileHandle(name, { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
      } catch {
        this.download(blob, name); // 写目录失败时回退下载
      }
    } else {
      this.download(blob, name);
    }
    this.savedCount++;
    return true;
  }

  private download(blob: Blob, name: string): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
}

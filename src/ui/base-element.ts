import { SHARED_CSS } from './styles';

/**
 * Web Components 基类：
 * - 统一使用构造样式表（adoptedStyleSheets）
 * - 提供 requestUpdate 微批渲染
 */
export class BaseElement extends HTMLElement {
  static styles: string = '';
  private static sheetCache = new WeakMap<typeof BaseElement, CSSStyleSheet[]>();

  protected root: ShadowRoot;
  #updatePending = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.adoptedStyleSheets = BaseElement.sheetsFor(this.constructor as typeof BaseElement);
  }

  private static sheetsFor(ctor: typeof BaseElement): CSSStyleSheet[] {
    const cached = BaseElement.sheetCache.get(ctor);
    if (cached) return cached;
    const sheets: CSSStyleSheet[] = [];
    const shared = new CSSStyleSheet();
    shared.replaceSync(SHARED_CSS);
    sheets.push(shared);
    if (ctor.styles) {
      const own = new CSSStyleSheet();
      own.replaceSync(ctor.styles);
      sheets.push(own);
    }
    // 基类也有样式时一并附加
    if (ctor !== BaseElement && BaseElement.styles) {
      const base = new CSSStyleSheet();
      base.replaceSync(BaseElement.styles);
      sheets.push(base);
    }
    BaseElement.sheetCache.set(ctor, sheets);
    return sheets;
  }

  protected requestUpdate(): void {
    if (this.#updatePending) return;
    this.#updatePending = true;
    queueMicrotask(() => {
      this.#updatePending = false;
      if (this.isConnected) this.update();
    });
  }

  /** 子类实现：读取当前状态并同步 DOM（不重建整棵子树） */
  protected update(): void {}

  $(selector: string): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(selector);
  }

  protected emit<T>(type: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true }));
  }
}

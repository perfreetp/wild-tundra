import { cloneView, createDefaultView, sanitizeView } from './view';
import type { ViewState } from './types';

export type StoreReason =
  | 'init'
  | 'layer-opacity'
  | 'layer-blend'
  | 'layer-visible'
  | 'layer-order'
  | 'fog'
  | 'color-temp'
  | 'night'
  | 'camera'
  | 'import'
  | 'reset'
  | 'preset-applied';

export interface StoreChange {
  state: Readonly<ViewState>;
  reason: StoreReason;
}

type Listener = (change: StoreChange) => void;

class ViewStore {
  #state: ViewState = createDefaultView();
  #listeners = new Set<Listener>();
  #version = 0;

  get state(): Readonly<ViewState> {
    return this.#state;
  }

  get version(): number {
    return this.#version;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** 以函数式更新；返回是否发生了变化 */
  update(mutator: (draft: ViewState) => boolean | void, reason: StoreReason): boolean {
    const draft = cloneView(this.#state);
    const result = mutator(draft);
    if (result === false) return false;
    this.#state = draft;
    this.#version += 1;
    this.#emit(reason);
    return true;
  }

  replace(next: unknown, reason: StoreReason): void {
    this.#state = sanitizeView(next);
    this.#version += 1;
    this.#emit(reason);
  }

  reset(): void {
    this.#state = createDefaultView();
    this.#version += 1;
    this.#emit('reset');
  }

  #emit(reason: StoreReason): void {
    const change: StoreChange = { state: this.#state, reason };
    for (const listener of this.#listeners) listener(change);
  }
}

export const store = new ViewStore();

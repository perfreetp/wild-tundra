import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../src/core/store';
import { createDefaultView } from '../src/core/view';

describe('store', () => {
  beforeEach(() => {
    store.reset();
  });

  it('更新会广播变化与原因', () => {
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.update((draft) => {
      draft.fog = 0.9;
    }, 'fog');
    expect(listener).toHaveBeenCalledTimes(1);
    const change = listener.mock.calls[0]?.[0];
    expect(change.reason).toBe('fog');
    expect(change.state.fog).toBe(0.9);
    off();
    store.update((draft) => {
      draft.fog = 0.1;
    }, 'fog');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('mutator 返回 false 时视为无变化', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    const changed = store.update(() => false, 'layer-opacity');
    expect(changed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('状态对象不可被外部修改（每次生成新对象）', () => {
    const before = store.state;
    store.update((draft) => {
      draft.layers.near.opacity = 0.25;
    }, 'layer-opacity');
    expect(store.state).not.toBe(before);
    expect(before.layers.near.opacity).toBe(1);
    expect(store.state.layers.near.opacity).toBe(0.25);
  });

  it('replace 会规整非法输入', () => {
    store.replace({ fog: 99, camera: { pitch: 999 } }, 'import');
    expect(store.state.fog).toBe(1);
    expect(store.state.camera.pitch).toBe(30);
  });

  it('reset 回到默认值', () => {
    store.update((draft) => {
      draft.night = true;
      draft.fog = 0.05;
    }, 'night');
    store.reset();
    expect(store.state).toEqual(createDefaultView());
  });

  it('version 单调递增', () => {
    const v0 = store.version;
    store.update((draft) => {
      draft.fog = 0.5;
    }, 'fog');
    expect(store.version).toBe(v0 + 1);
  });
});

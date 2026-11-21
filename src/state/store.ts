import { createSignal, type Accessor, type Setter } from 'solid-js';

/** 信号读取函数的别名,让类字段语义更清晰 */
export type SignalAccessor<T> = Accessor<T>;
export type SignalSetter<T> = Setter<T>;
import {
  type TileState,
  type TileKind,
  type Connection,
  findSnap,
  connKey,
  removeConnectionsOf,
  tileOverlaps,
  findConnection,
  MAX_FOLD,
  FOLD_STEP,
  ANGLE_SNAP,
  quantizeAngle,
} from '../geometry/math';
import { TILE_COLORS } from './colors';
import { TEMPLATES, type Template } from './templates';

export type AppMode = 'flat' | 'folded';

/** 历史事件:每一步搭法都留记录,可撤销/重做/回放 */
export type HistoryEvent =
  | { type: 'add'; tile: TileState }
  | { type: 'move'; id: number; from: Pose; to: Pose }
  | { type: 'connect'; conn: Connection }
  | { type: 'disconnect'; conn: Connection }
  | { type: 'remove'; tile: TileState; removedConns: Connection[] }
  | { type: 'fold'; connKey: string; from: number; to: number };

type Pose = { x: number; z: number; rot: number };

export interface Snapshot {
  tiles: TileState[];
  conns: Connection[];
}

let nextId = 1;

export class AppStore {
  // 每个信号拆成 accessor + setter,避免元组被误调用
  private _tiles = createSignal<TileState[]>([]);
  getTiles: SignalAccessor<TileState[]> = this._tiles[0];
  private setTilesSig = this._tiles[1];

  private _conns = createSignal<Connection[]>([]);
  getConns: SignalAccessor<Connection[]> = this._conns[0];
  private setConnsSig = this._conns[1];

  private _mode = createSignal<AppMode>('flat');
  mode: SignalAccessor<AppMode> = this._mode[0];
  private setMode = this._mode[1];

  private _rootId = createSignal<number>(1);
  rootId: SignalAccessor<number> = this._rootId[0];
  private setRootId = this._rootId[1];

  private _lights = createSignal<{ id: number; x: number; z: number }[]>([
    { id: 1, x: -4, z: 5 },
    { id: 2, x: 4, z: 5 },
  ]);
  lights: SignalAccessor<{ id: number; x: number; z: number }[]> = this._lights[0];
  private setLightsSig = this._lights[1];

  private _liftedId = createSignal<number | null>(null);
  liftedId: SignalAccessor<number | null> = this._liftedId[0];
  private setLiftedId = this._liftedId[1];

  private _brokenEdges = createSignal<string[]>([]);
  brokenEdges: SignalAccessor<string[]> = this._brokenEdges[0];
  private setBrokenEdges = this._brokenEdges[1];

  private _overlapIds = createSignal<number[]>([]);
  overlapIds: SignalAccessor<number[]> = this._overlapIds[0];
  private setOverlapIds = this._overlapIds[1];

  private _activeTemplate = createSignal<Template | null>(null);
  activeTemplate: SignalAccessor<Template | null> = this._activeTemplate[0];
  private setActiveTemplate = this._activeTemplate[1];

  private _templateStep = createSignal<number>(0);
  templateStep: SignalAccessor<number> = this._templateStep[0];
  private setTemplateStep = this._templateStep[1];

  // 历史(非响应式)
  private past: HistoryEvent[] = [];
  private future: HistoryEvent[] = [];

  private _replayIndex = createSignal<number | null>(null);
  replayIndex: SignalAccessor<number | null> = this._replayIndex[0];
  private setReplayIndex = this._replayIndex[1];

  private _recording = createSignal<boolean>(true);
  private recording: SignalAccessor<boolean> = this._recording[0];
  private setRecording = this._recording[1];

  setTiles(t: TileState[]) {
    this.setTilesSig(t);
  }
  setConns(c: Connection[]) {
    this.setConnsSig(c);
  }

  private pushEvent(e: HistoryEvent) {
    if (!this.recording()) return;
    this.past.push(e);
    this.future = [];
  }

  canUndo = () => this.past.length > 0 && this.replayIndex() === null;
  canRedo = () => this.future.length > 0 && this.replayIndex() === null;

  /** 从片库新增一片 */
  addTile(kind: TileKind, x: number, z: number, rot = 0): TileState {
    const tile: TileState = {
      id: nextId++,
      kind,
      x,
      z,
      rot,
      color: TILE_COLORS[kind].front,
    };
    this.setTiles([...this.getTiles(), tile]);
    this.pushEvent({ type: 'add', tile });
    this.checkTemplateProgress();
    return tile;
  }

  /** 拖动结束:尝试吸附 */
  tryPlace(tile: TileState): { placed: TileState; snapped: boolean } {
    const others = this.getTiles().filter((t) => t.id !== tile.id);
    const snap = findSnap(tile, others);
    if (snap) {
      const from: Pose = { x: tile.x, z: tile.z, rot: tile.rot };
      const placed: TileState = {
        ...tile,
        x: snap.targetX,
        z: snap.targetZ,
        rot: snap.targetRot,
      };
      this.updateTile(placed);
      this.pushEvent({ type: 'move', id: tile.id, from, to: { x: placed.x, z: placed.z, rot: placed.rot } });

      const k1 = connKey(tile.id, snap.edgeIndex);
      const k2 = connKey(snap.otherId, snap.otherEdge);
      const exists = this.getConns().some(
        (c) => (c.a === k1 && c.b === k2) || (c.a === k2 && c.b === k1),
      );
      if (!exists) {
        const conn: Connection = { a: k1, b: k2, fold: 0 };
        this.setConns([...this.getConns(), conn]);
        this.pushEvent({ type: 'connect', conn });
      }
      this.checkTemplateProgress();
      return { placed, snapped: true };
    }

    if (tileOverlaps(tile, others)) {
      this.flashOverlap(tile.id);
    }
    const old = this.getTiles().find((t) => t.id === tile.id);
    if (old && (old.x !== tile.x || old.z !== tile.z || old.rot !== tile.rot)) {
      const from: Pose = { x: old.x, z: old.z, rot: old.rot };
      this.updateTile(tile);
      this.pushEvent({ type: 'move', id: tile.id, from, to: { x: tile.x, z: tile.z, rot: tile.rot } });
    }
    return { placed: tile, snapped: false };
  }

  private flashOverlap(id: number) {
    this.setOverlapIds([id]);
    setTimeout(() => this.setOverlapIds([]), 600);
  }

  updateTile(tile: TileState) {
    this.setTiles(this.getTiles().map((t) => (t.id === tile.id ? tile : t)));
  }

  /** 转动手柄:15° 步进 */
  rotateTile(id: number, delta: 1 | -1) {
    const t = this.getTiles().find((x) => x.id === id);
    if (!t) return;
    const from: Pose = { x: t.x, z: t.z, rot: t.rot };
    const updated = { ...t, rot: quantizeAngle(t.rot + delta * ANGLE_SNAP) };
    this.updateTile(updated);
    this.pushEvent({ type: 'move', id, from, to: { x: updated.x, z: updated.z, rot: updated.rot } });
  }

  /** 拖动一片离开:断开连接(黄色描边) */
  detachTile(id: number) {
    const { conns, broken } = removeConnectionsOf(this.getConns(), id);
    const removed = this.getConns().filter((c) => !conns.includes(c));
    for (const c of removed) this.pushEvent({ type: 'disconnect', conn: c });
    this.setConns(conns);
    if (broken.length) {
      this.setBrokenEdges(broken);
      setTimeout(() => this.setBrokenEdges([]), 1500);
    }
  }

  removeTile(id: number) {
    const tile = this.getTiles().find((t) => t.id === id);
    if (!tile) return;
    const removedConns = this.getConns().filter(
      (c) => c.a.startsWith(`${id}:`) || c.b.startsWith(`${id}:`),
    );
    const { conns } = removeConnectionsOf(this.getConns(), id);
    this.setConns(conns);
    this.setTiles(this.getTiles().filter((t) => t.id !== id));
    this.pushEvent({ type: 'remove', tile, removedConns });
  }

  standUp(rootId?: number) {
    if (this.getTiles().length === 0) return;
    this.setRootId(rootId ?? this.getTiles()[0].id);
    this.setMode('folded');
  }

  layFlat() {
    this.setMode('flat');
    this.setConns(this.getConns().map((c) => ({ ...c, fold: 0 })));
    this.setLiftedId(null);
  }

  /** 沿公共边折叠一步(15°),上限 120° */
  foldOnce(connKeyStr: string, delta: 1 | -1): number | null {
    const conn = this.getConns().find((c) => c.a === connKeyStr || c.b === connKeyStr);
    if (!conn) return null;
    const next = Math.min(MAX_FOLD, Math.max(0, conn.fold + delta * FOLD_STEP));
    if (Math.abs(next - conn.fold) < 1e-9) return conn.fold;
    const from = conn.fold;
    this.setConns(
      this.getConns().map((c) => (c === conn ? { ...c, fold: next } : c)),
    );
    this.pushEvent({ type: 'fold', connKey: connKeyStr, from, to: next });
    return next;
  }

  currentFoldAngle(connKeyStr: string): number {
    const conn = this.getConns().find((c) => c.a === connKeyStr || c.b === connKeyStr);
    return conn ? conn.fold : 0;
  }

  setLifted(id: number | null) {
    this.setLiftedId(id);
  }

  moveLight(id: number, x: number, z: number) {
    this.setLightsSig(this.lights().map((l) => (l.id === id ? { ...l, x, z } : l)));
  }

  // ---------- 模板 ----------

  loadTemplate(t: Template) {
    this.reset();
    this.setActiveTemplate(t);
    this.setTemplateStep(0);
  }

  clearTemplate() {
    this.setActiveTemplate(null);
    this.setTemplateStep(0);
  }

  nextTemplateHint(): { kind: TileKind; x: number; z: number; rot: number } | null {
    const t = this.activeTemplate();
    if (!t) return null;
    const step = this.templateStep();
    if (step >= t.tiles.length) return null;
    return t.tiles[step];
  }

  private checkTemplateProgress() {
    const t = this.activeTemplate();
    if (!t) return;
    const step = this.templateStep();
    const want = t.tiles[step];
    if (!want) return;
    const matched = this.getTiles().some(
      (tile) =>
        tile.kind === want.kind &&
        Math.abs(tile.x - want.x) < 0.6 &&
        Math.abs(tile.z - want.z) < 0.6,
    );
    if (matched) this.setTemplateStep(step + 1);
  }

  // ---------- 撤销 / 重做 ----------

  undo() {
    const e = this.past.pop();
    if (!e) return;
    this.applyInverse(e);
    this.future.push(e);
  }

  redo() {
    const e = this.future.pop();
    if (!e) return;
    this.applyForward(e);
    this.past.push(e);
  }

  private applyInverse(e: HistoryEvent) {
    switch (e.type) {
      case 'add':
        this.setTiles(this.getTiles().filter((t) => t.id !== e.tile.id));
        break;
      case 'move': {
        const t = this.getTiles().find((x) => x.id === e.id);
        if (t) this.updateTile({ ...t, ...e.from });
        break;
      }
      case 'connect':
        this.setConns(this.getConns().filter((c) => c !== e.conn));
        break;
      case 'disconnect':
        this.setConns([...this.getConns(), e.conn]);
        break;
      case 'remove':
        this.setTiles([...this.getTiles(), e.tile]);
        this.setConns([...this.getConns(), ...e.removedConns]);
        break;
      case 'fold': {
        const conn = this.getConns().find((c) => c.a === e.connKey || c.b === e.connKey);
        if (conn) this.setConns(this.getConns().map((c) => (c === conn ? { ...c, fold: e.from } : c)));
        break;
      }
    }
  }

  private applyForward(e: HistoryEvent) {
    switch (e.type) {
      case 'add':
        this.setTiles([...this.getTiles(), e.tile]);
        break;
      case 'move': {
        const t = this.getTiles().find((x) => x.id === e.id);
        if (t) this.updateTile({ ...t, ...e.to });
        break;
      }
      case 'connect':
        this.setConns([...this.getConns(), e.conn]);
        break;
      case 'disconnect':
        this.setConns(this.getConns().filter((c) => c !== e.conn));
        break;
      case 'remove':
        this.setTiles(this.getTiles().filter((t) => t.id !== e.tile.id));
        this.setConns(this.getConns().filter((c) => !e.removedConns.includes(c)));
        break;
      case 'fold': {
        const conn = this.getConns().find((c) => c.a === e.connKey || c.b === e.connKey);
        if (conn) this.setConns(this.getConns().map((c) => (c === conn ? { ...c, fold: e.to } : c)));
        break;
      }
    }
  }

  // ---------- 回放 ----------

  startReplay() {
    this.setRecording(false);
    this.setTiles([]);
    this.setConns([]);
    this.setReplayIndex(0);
  }

  replayNext(): boolean {
    const idx = this.replayIndex();
    if (idx === null) return false;
    if (idx >= this.past.length) {
      this.finishReplay();
      return false;
    }
    this.applyForward(this.past[idx]);
    this.setReplayIndex(idx + 1);
    return true;
  }

  replayPrev(): boolean {
    const idx = this.replayIndex();
    if (idx === null || idx <= 0) return false;
    const newIdx = idx - 1;
    this.applyInverse(this.past[newIdx]);
    this.setReplayIndex(newIdx);
    return true;
  }

  finishReplay() {
    this.setReplayIndex(null);
    this.setRecording(true);
  }

  isReplaying = () => this.replayIndex() !== null;
  replayTotal = () => this.past.length;

  reset() {
    this.setTiles([]);
    this.setConns([]);
    this.past = [];
    this.future = [];
    this.setMode('flat');
    this.setLiftedId(null);
    this.setBrokenEdges([]);
    this.setOverlapIds([]);
    this.setActiveTemplate(null);
    this.setTemplateStep(0);
    this.setReplayIndex(null);
    this.setRecording(true);
  }

  snapshot(): Snapshot {
    return {
      tiles: this.getTiles().map((t) => ({ ...t })),
      conns: this.getConns().map((c) => ({ ...c })),
    };
  }

  isBroken(tileId: number, edge: number) {
    return this.brokenEdges().includes(connKey(tileId, edge));
  }

  edgeConnected(tileId: number, edge: number) {
    return !!findConnection(this.getConns(), tileId, edge);
  }

  historyCount() {
    return this.past.length;
  }

  templates = TEMPLATES;
}

export const store = new AppStore();

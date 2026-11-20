import { Color3, Vector3 } from '@babylonjs/core';
import type { Engine } from '@babylonjs/core';
import { createEngine } from './engine';
import { createWorld, maxDepthBeforePenetration, organContact, UNIT_TO_MM, type World } from './world';
import { Instrument } from './instrument';
import { createGraspables, type Graspable } from './graspables';
import { TaskManager } from './tasks';
import { Recorder, Replayer } from './recorder';
import { uiState, commands } from './store';
import type { TaskId, TipReading } from './types';

/** 吸附距离阈值(场景单位) */
const GRASP_DIST = 1.6;
/** 钳口闭合到该角度(rad)以下且附近有物体 -> 吸附 */
const GRASP_JAW = 0.14;
/** 钳口张开超过该角度 -> 松开抛出 */
const RELEASE_JAW = 0.3;
/** 器官允许的最大穿透深度(场景单位) */
const MAX_PENETRATION = 0.15;

interface KeyBinding {
  left: string;
  right: string;
}

/** 键位:左钳 WASD+QE+ZX+CV,右钳 IJKL+UO+NM+,. */
const KEYS = {
  moveLeft: { left: 'a', right: 'j' } as KeyBinding,
  moveRight: { left: 'd', right: 'l' } as KeyBinding,
  moveForward: { left: 'w', right: 'i' } as KeyBinding,
  moveBack: { left: 's', right: 'k' } as KeyBinding,
  insert: { left: 'q', right: 'u' } as KeyBinding,
  retract: { left: 'e', right: 'o' } as KeyBinding,
  jawClose: { left: 'z', right: 'n' } as KeyBinding,
  jawOpen: { left: 'x', right: 'm' } as KeyBinding,
  rollCW: { left: 'c', right: ',' } as KeyBinding,
  rollCCW: { left: 'v', right: '.' } as KeyBinding
};

const HANDLE_SPEED = 7;   // 场景单位 / s
const DEPTH_SPEED = 9;
const JAW_SPEED = 1.6;    // rad / s
const ROLL_SPEED = 2.4;

export class Simulation {
  private engine!: Engine;
  private world!: World;
  private instruments: Instrument[] = [];
  private graspables: Graspable[] = [];
  private tasks = new TaskManager();
  private recorder = new Recorder();
  private replayer = new Replayer();
  private pressed = new Set<string>();
  private uiTimer = 0;
  private messageTimer = 0;
  private message = '';

  constructor(private canvas: HTMLCanvasElement) {}

  async init(): Promise<void> {
    const { engine, kind } = await createEngine(this.canvas);
    this.engine = engine;
    this.world = createWorld(engine, this.canvas);

    this.instruments = [
      new Instrument(this.world.scene, '左钳', this.world.trocars[0], new Color3(0.35, 0.65, 1)),
      new Instrument(this.world.scene, '右钳', this.world.trocars[1], new Color3(1, 0.55, 0.3))
    ];
    this.graspables = createGraspables(this.world.scene, this.world.organ);
    this.tasks.switchTo('grasp', this.graspables);

    this.bindInput();
    this.bindCommands();

    uiState.update((s) => ({ ...s, engineKind: kind }));

    this.engine.runRenderLoop(() => {
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.05);
      this.update(dt);
      this.world.scene.render();
    });
    window.addEventListener('resize', () => this.engine.resize());
  }

  // ---------- 输入 ----------

  private bindInput(): void {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      this.pressed.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.pressed.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.pressed.clear());
  }

  private bindCommands(): void {
    commands.switchTask = (id: TaskId) => {
      this.tasks.switchTo(id, this.graspables);
      this.flash(`已切换到「${this.tasks.status().title}」`);
    };
    commands.toggleRecord = () => {
      if (this.recorder.recording) {
        this.recorder.stop();
        this.flash(`记录停止,共 ${this.recorder.frameCount} 帧`);
      } else {
        this.recorder.start(this.tasks.current);
        this.flash('开始记录操作…');
      }
    };
    commands.exportRecord = () => {
      if (this.recorder.frameCount === 0) {
        this.flash('没有可导出的记录,请先开始记录');
        return;
      }
      this.recorder.download();
      this.flash('记录已导出为 JSON');
    };
    commands.replay = (json: string) => {
      const err = this.replayer.load(json);
      if (err) this.flash(`回放失败:${err}`);
      else this.flash('回放中…(输入已锁定)');
    };
    commands.stopReplay = () => {
      this.replayer.stop();
      this.flash('回放已停止');
    };
  }

  private applyInput(dt: number): void {
    const down = (b: KeyBinding, i: number) => this.pressed.has(i === 0 ? b.left : b.right);
    for (let i = 0; i < 2; i++) {
      const inst = this.instruments[i];
      let dx = 0;
      let dz = 0;
      if (down(KEYS.moveLeft, i)) dx -= 1;
      if (down(KEYS.moveRight, i)) dx += 1;
      if (down(KEYS.moveForward, i)) dz -= 1;
      if (down(KEYS.moveBack, i)) dz += 1;
      if (dx || dz) inst.moveHandle(dx * HANDLE_SPEED * dt, dz * HANDLE_SPEED * dt);
      if (down(KEYS.insert, i)) inst.adjustDepth(DEPTH_SPEED * dt);
      if (down(KEYS.retract, i)) inst.adjustDepth(-DEPTH_SPEED * dt);
      if (down(KEYS.jawClose, i)) inst.adjustJaw(-JAW_SPEED * dt);
      if (down(KEYS.jawOpen, i)) inst.adjustJaw(JAW_SPEED * dt);
      if (down(KEYS.rollCW, i)) inst.adjustRoll(ROLL_SPEED * dt);
      if (down(KEYS.rollCCW, i)) inst.adjustRoll(-ROLL_SPEED * dt);
    }
  }

  // ---------- 抓取 ----------

  private updateGrasp(): void {
    for (let i = 0; i < 2; i++) {
      const inst = this.instruments[i];
      const tip = inst.getTipPosition();
      const jaw = inst.state.jaw;

      // 松开:钳口张开超过阈值,按钳尖速度抛出
      for (const g of this.graspables) {
        if (g.heldBy === i && jaw > RELEASE_JAW) {
          g.release(inst.tipVelocity.clone());
        }
      }

      // 吸附:钳口收拢且附近有未被持有的物体
      if (jaw < GRASP_JAW) {
        let best: Graspable | null = null;
        let bestD = GRASP_DIST;
        for (const g of this.graspables) {
          if (g.heldBy !== null || g.threaded) continue;
          const d = Vector3.Distance(tip, g.position);
          if (d < bestD) {
            bestD = d;
            best = g;
          }
        }
        if (best) best.attach(i);
      }

      // 跟随钳尖
      for (const g of this.graspables) {
        if (g.heldBy === i) g.followTip(tip, inst.getShaftDir());
      }
    }
  }

  // ---------- 主循环 ----------

  private update(dt: number): void {
    const replaying = this.replayer.playing;
    if (replaying) {
      this.replayer.update(dt, this.instruments);
    } else {
      this.applyInput(dt);
    }

    // 器官碰撞:限制穿透深度 + 接触高亮
    let anyContact = false;
    for (const inst of this.instruments) {
      const maxDepth = maxDepthBeforePenetration(
        this.world.organ,
        inst.trocar,
        inst.getShaftDir(),
        MAX_PENETRATION
      );
      inst.clampDepth(maxDepth);
      inst.update(dt);
      const hit = organContact(this.world.organ, inst.getTipPosition());
      if (hit.contact) anyContact = true;
    }
    this.world.setOrganHighlight(anyContact);

    if (!replaying) {
      this.updateGrasp();
      for (const g of this.graspables) g.update(dt);
      this.tasks.update(dt, this.world, this.graspables);
      this.recorder.update(dt, this.instruments);
    }

    // UI 同步(10 Hz)
    this.uiTimer += dt;
    if (this.uiTimer > 0.1) {
      this.uiTimer = 0;
      this.pushUi();
    }
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.message = '';
        this.pushUi();
      }
    }
  }

  private flash(msg: string): void {
    this.message = msg;
    this.messageTimer = 3;
    this.pushUi();
  }

  private pushUi(): void {
    const tips: TipReading[] = this.instruments.map((inst, i) => {
      const p = inst.getTipPosition();
      const held = this.graspables.find((g) => g.heldBy === i);
      return {
        pos: { x: p.x * UNIT_TO_MM, y: p.y * UNIT_TO_MM, z: p.z * UNIT_TO_MM },
        joints: inst.getJointAngles(UNIT_TO_MM),
        jawDeg: (inst.state.jaw * 180) / Math.PI,
        contact: organContact(this.world.organ, p).contact,
        holding: held ? held.label : null
      };
    });
    uiState.update((s) => ({
      ...s,
      tips,
      task: this.tasks.status(),
      recording: this.recorder.recording,
      recordFrames: this.recorder.frameCount,
      replaying: this.replayer.playing,
      message: this.message
    }));
  }
}

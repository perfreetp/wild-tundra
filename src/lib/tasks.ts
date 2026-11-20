import { Vector3 } from '@babylonjs/core';
import type { TaskId, TaskStatus } from './types';
import type { Graspable } from './graspables';
import type { World } from './world';

interface TaskDef {
  id: TaskId;
  title: string;
  description: string;
}

export const TASK_DEFS: TaskDef[] = [
  { id: 'grasp', title: '任务一 · 夹取', description: '用任意一把抓钳夹住小球并稳定保持 1.5 秒。' },
  { id: 'place', title: '任务二 · 放置', description: '夹取小球并放入发光目标环内(在环内松开)。' },
  { id: 'ring', title: '任务三 · 穿孔环', description: '夹取圆环,从立柱上方向下套入立柱。' }
];

export class TaskManager {
  current: TaskId = 'grasp';
  private holdTimer = 0;
  private elapsed = 0;
  private doneFlag = false;

  switchTo(id: TaskId, graspables: Graspable[]): void {
    this.current = id;
    this.holdTimer = 0;
    this.elapsed = 0;
    this.doneFlag = false;
    graspables.forEach((g) => g.reset());
  }

  reset(graspables: Graspable[]): void {
    this.switchTo(this.current, graspables);
  }

  update(dt: number, world: World, graspables: Graspable[]): void {
    if (!this.doneFlag) this.elapsed += dt;
    const balls = graspables.filter((g) => g.kind === 'ball');
    const ring = graspables.find((g) => g.kind === 'ring');

    switch (this.current) {
      case 'grasp': {
        const held = balls.some((b) => b.heldBy !== null);
        this.holdTimer = held ? this.holdTimer + dt : 0;
        if (this.holdTimer >= 1.5) this.doneFlag = true;
        break;
      }
      case 'place': {
        const inZone = balls.some((b) => {
          if (b.heldBy !== null) return false;
          const d = Vector3.Distance(b.position, world.targetZoneCenter);
          return d < world.targetZoneRadius;
        });
        if (inZone) this.doneFlag = true;
        break;
      }
      case 'ring': {
        if (ring && !ring.threaded && ring.heldBy === null) {
          const p = ring.position;
          const horiz = Math.hypot(p.x - world.pegBase.x, p.z - world.pegBase.z);
          // 环心在立柱轴线附近且高度低于柱顶 -> 判定套入,吸附到柱底
          if (horiz < 1.2 && p.y < world.pegTop.y + 0.4 && p.y > world.pegBase.y - 0.5) {
            ring.threaded = true;
            ring.velocity.setAll(0);
            p.set(world.pegBase.x, world.pegBase.y + 0.3, world.pegBase.z);
            this.doneFlag = true;
          }
        }
        break;
      }
    }
  }

  status(): TaskStatus {
    const def = TASK_DEFS.find((t) => t.id === this.current)!;
    let progress = '';
    if (this.current === 'grasp' && !this.doneFlag) {
      progress = `保持中 ${this.holdTimer.toFixed(1)} / 1.5 s`;
    }
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      done: this.doneFlag,
      progress,
      elapsed: this.elapsed
    };
  }
}

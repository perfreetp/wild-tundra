import * as THREE from 'three';
import { WebGPURenderer, MeshBasicNodeMaterial } from 'three/webgpu';
import { ThermalField, clamp } from '../thermal/field';
import { buildThermalMaterial, buildPostPipeline, type PostPipeline } from '../thermal/thermalNodes';
import { buildBuilding, EYE_HEIGHT } from '../scene/building';
import { FireVisual } from '../scene/fire';
import { SmokeLayer } from '../scene/smoke';
import { FPSControls } from './controls';
import {
  TrajectoryRecorder, TrajectoryPlayer, AutoRoam,
  exportTrajectory, parseTrajectoryFile
} from '../path/roam';
import { FrHud, FrToolbar, toast, type RenderMode } from '../ui/components';

const SCENE_KEY = 'fire-roam:scene';
const TRAJECTORY_KEY = 'fire-roam:trajectory';
const START_POS = new THREE.Vector3(-9, EYE_HEIGHT, 1.1);

export class FireRoamApp {
  private container: HTMLElement;
  private renderer!: WebGPURenderer;
  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private controls!: FPSControls;
  private field!: ThermalField;
  private fires: FireVisual[] = [];
  private smoke!: SmokeLayer;
  private post!: PostPipeline;
  private clock = new THREE.Clock();

  private mode: RenderMode = 'visible';
  private thermalMat!: MeshBasicNodeMaterial;
  private swapped: Array<{ mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }> = [];

  private recorder = new TrajectoryRecorder(10);
  private player = new TrajectoryPlayer();
  private autoRoam = new AutoRoam();

  private hud!: FrHud;
  private toolbar!: FrToolbar;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async start(): Promise<void> {
    // WebGPU 不可用时回退 WebGL2(同一 WebGPURenderer API)
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    this.renderer = new WebGPURenderer({
      antialias: true,
      forceWebGL: !hasWebGPU
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    await this.renderer.init();
    this.container.appendChild(this.renderer.domElement);
    if (!hasWebGPU) toast('当前浏览器不支持 WebGPU,已回退到 WebGL2 后端', 4000);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 120);

    // 场景与热场数据(优先从浏览器本地恢复)
    this.field = this.loadField();
    this.scene.background = new THREE.Color(0x060607);
    this.scene.fog = new THREE.FogExp2(0x0b0b0c, 0.02);
    this.scene.add(new THREE.HemisphereLight(0x3a3f4a, 0x1a1510, 0.55));

    const building = buildBuilding();
    this.scene.add(building.group);

    for (const [i, f] of this.field.fires.entries()) {
      const visual = new FireVisual(f, i * 3.7 + 1);
      this.fires.push(visual);
      this.scene.add(visual.group);
    }

    this.smoke = new SmokeLayer(this.field);
    this.scene.add(this.smoke.points);

    // 热成像材质与可切换网格清单
    this.thermalMat = buildThermalMaterial(this.field.fires, this.field.ambient);
    building.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        this.swapped.push({ mesh, original: mesh.material });
      }
    });
    for (const fv of this.fires) {
      fv.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh;
          this.swapped.push({ mesh, original: mesh.material });
        }
      });
    }

    // 后处理(热浪扭曲)
    this.post = buildPostPipeline(this.renderer, this.scene, this.camera);

    // 第一人称控制(相机挂在姿态节点下)
    this.controls = new FPSControls(this.renderer.domElement, START_POS, -Math.PI / 2);
    this.controls.object.add(this.camera);
    this.scene.add(this.controls.object);

    // 上次录制的轨迹
    const savedTrajectory = this.loadTrajectory();
    if (savedTrajectory) this.player.load(savedTrajectory);

    // 自动漫游 / 回放结束回调
    const releaseControl = () => {
      this.controls.enabled = true;
      this.toolbar.setState({ roaming: false, playing: false });
    };
    this.autoRoam.onFinished = () => { releaseControl(); toast('自动漫游结束'); };
    this.player.onFinished = () => { releaseControl(); toast('轨迹回放结束'); };

    // UI
    this.hud = document.querySelector('fr-hud')!;
    this.toolbar = document.querySelector('fr-toolbar')!;
    this.toolbar.addEventListener('command', (e) => {
      this.handleCommand((e as CustomEvent<string>).detail);
    });
    this.refreshToolbar();

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput.addEventListener('change', () => this.handleImportFile(fileInput));

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.renderer.setAnimationLoop(() => this.tick());
  }

  // ---------- 主循环 ----------

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const now = this.clock.elapsedTime;

    // 位姿驱动优先级:轨迹回放 > 自动漫游 > 手动
    if (this.player.playing) {
      this.player.apply(now, this.controls.object);
    } else if (this.autoRoam.active) {
      this.autoRoam.apply(now, this.controls.object);
    } else {
      this.controls.update(dt);
    }

    // 轨迹记录
    this.recorder.sample(now, this.controls.object);

    // 火焰 / 烟气动画
    for (const f of this.fires) f.update(now);
    this.smoke.update(dt, now);

    // 当前位置热环境
    const eye = this.controls.object.position;
    const temp = this.field.temperatureAt(eye);
    const visibility = this.field.visibilityAt(eye);
    const smoke = this.field.smokeAt(eye);

    // 雾密度随烟气浓度变化(热成像模式穿透性更强)
    const fog = this.scene.fog as THREE.FogExp2;
    const baseDensity = 0.012 + smoke * 0.085;
    fog.density = this.mode === 'thermal' ? baseDensity * 0.35 : baseDensity;

    // 热浪扭曲:相机附近温度越高扭曲越强
    this.post.hazeStrength.value = clamp((temp - 55) / 500, 0, 1) * 0.011;

    // HUD
    this.hud.update({ temperature: temp, visibility, position: eye, mode: this.mode });

    void this.post.render();
  }

  // ---------- 命令 ----------

  private handleCommand(cmd: string): void {
    switch (cmd) {
      case 'mode-thermal':
        this.setMode('thermal');
        break;
      case 'mode-visible':
        this.setMode('visible');
        break;
      case 'roam':
        this.toggleAutoRoam();
        break;
      case 'record':
        this.toggleRecord();
        break;
      case 'export':
        this.handleExport();
        break;
      case 'import':
        this.handleImport();
        break;
      case 'reset':
        this.resetView();
        break;
    }
  }

  private setMode(mode: RenderMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'thermal') {
      for (const s of this.swapped) s.mesh.material = this.thermalMat;
    } else {
      for (const s of this.swapped) s.mesh.material = s.original;
    }
    this.smoke.setThermalMode(mode === 'thermal');
    this.toolbar.setState({ mode });
    toast(mode === 'thermal' ? '已切换到热成像模式' : '已切换到可见光模式');
  }

  private toggleAutoRoam(): void {
    if (this.autoRoam.active) {
      this.autoRoam.stop();
      this.controls.enabled = true;
      this.toolbar.setState({ roaming: false });
      return;
    }
    if (this.player.playing) this.player.stop();
    this.controls.enabled = false;
    this.autoRoam.start(this.clock.elapsedTime);
    this.toolbar.setState({ roaming: true, playing: false });
    toast('开始沿预设路径自动漫游');
  }

  private toggleRecord(): void {
    if (this.recorder.recording) {
      this.recorder.stop();
      localStorage.setItem(TRAJECTORY_KEY, JSON.stringify(this.recorder.samples));
      this.player.load(this.recorder.samples);
      this.toolbar.setState({ recording: false, hasTrajectory: this.recorder.samples.length > 1 });
      toast(`录制完成,共 ${this.recorder.samples.length} 个采样点`);
    } else {
      this.recorder.start(this.clock.elapsedTime);
      this.toolbar.setState({ recording: true });
      toast('开始录制轨迹');
    }
  }

  private handleExport(): void {
    if (this.recorder.samples.length < 2) {
      toast('没有可导出的轨迹,请先录制');
      return;
    }
    exportTrajectory(this.recorder.samples, 'fire-roam-path');
    toast('路径文件已导出');
  }

  private handleImport(): void {
    if (this.player.playing) {
      this.player.stop();
      this.controls.enabled = true;
      this.toolbar.setState({ playing: false });
      return;
    }
    if (this.player.duration > 0) {
      // 已有轨迹(录制或导入的),直接回放
      this.startPlayback();
    } else {
      document.getElementById('file-input')!.click();
    }
  }

  private handleImportFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    file.text().then((text) => {
      try {
        const samples = parseTrajectoryFile(text);
        this.player.load(samples);
        localStorage.setItem(TRAJECTORY_KEY, JSON.stringify(samples));
        this.startPlayback();
        toast(`已载入路径:${file.name}`);
      } catch (err) {
        toast(`导入失败:${(err as Error).message}`, 3500);
      }
    });
  }

  private startPlayback(): void {
    if (this.autoRoam.active) this.autoRoam.stop();
    this.controls.enabled = false;
    this.player.play(this.clock.elapsedTime);
    this.toolbar.setState({ playing: true, roaming: false });
  }

  private resetView(): void {
    this.autoRoam.stop();
    this.player.stop();
    this.controls.enabled = true;
    this.controls.setPose(START_POS, new THREE.Vector3(0, EYE_HEIGHT, 1.1));
    this.toolbar.setState({ roaming: false, playing: false });
    toast('视角已重置');
  }

  private refreshToolbar(): void {
    this.toolbar.setState({
      mode: this.mode,
      recording: this.recorder.recording,
      hasTrajectory: this.recorder.samples.length > 1 || this.player.duration > 0
    });
  }

  // ---------- 本地持久化 ----------

  private loadField(): ThermalField {
    try {
      const raw = localStorage.getItem(SCENE_KEY);
      if (raw) return ThermalField.fromJSON(JSON.parse(raw));
    } catch {
      // 数据损坏则回退默认场景
    }
    const field = new ThermalField();
    field.fires = ThermalField.defaultFires();
    localStorage.setItem(SCENE_KEY, JSON.stringify(field.toJSON()));
    return field;
  }

  private loadTrajectory(): import('../path/roam').TrajectorySample[] | null {
    try {
      const raw = localStorage.getItem(TRAJECTORY_KEY);
      if (raw) {
        const samples = JSON.parse(raw);
        if (Array.isArray(samples) && samples.length > 1) return samples;
      }
    } catch {
      // 忽略损坏数据
    }
    return null;
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildCityScene, type CityScene } from './scene';
import { buildRayDirections, runScan, type ScanResult } from './scanner';
import { PointCloudRenderer } from './pointcloud';
import { ControlPanel } from './panel';
import { createDefaultMaterialParams, WEATHER_MAP } from './materials';
import { buildPointCloudText, downloadTextFile, exportFileName } from './exporter';
import type {
  MaterialParamMap,
  ScanConfig,
  WeatherLevel,
} from './types';

const DEFAULT_SCAN: ScanConfig = {
  channels: 64,
  horizontalResolutionDeg: 0.2,
  maxRange: 100,
  vfovTopDeg: -10,
  vfovBottomDeg: 30,
  sensorHeight: 1.8,
};

class LidarSimApp {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private city: CityScene;
  private cloud: PointCloudRenderer;
  private panel: ControlPanel;

  private materialParams: MaterialParamMap = createDefaultMaterialParams();
  private scanConfig: ScanConfig = { ...DEFAULT_SCAN };
  private weather: WeatherLevel = 'clear';
  private rayDirections: THREE.Vector3[] = [];
  private lastResult: ScanResult | null = null;
  private scanToken = 0;
  private rafId = 0;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x10151c);
    this.scene.fog = new THREE.FogExp2(0x10151c, 0);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      600,
    );
    this.camera.position.set(26, 20, 34);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.maxDistance = 220;

    // 灯光
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x303028, 0.9);
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(30, 50, 20);
    this.scene.add(hemi, sun);

    // 网格参考
    const grid = new THREE.GridHelper(200, 100, 0x33414f, 0x222a33);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    this.scene.add(grid);

    // 城市场景（含 BVH）
    this.city = buildCityScene();
    this.scene.add(this.city.group);
    this.scene.fog = this.city.fog;

    // 点云
    this.cloud = new PointCloudRenderer();
    this.scene.add(this.cloud.group);

    // 控制面板
    this.panel = new ControlPanel(this.materialParams, this.scanConfig, this.weather, {
      onMaterialChange: () => { /* 触发已在面板内统一防抖重扫 */ },
      onScanChange: (cfg) => {
        this.scanConfig = cfg;
        this.rebuildRaysAndScan();
      },
      onWeatherChange: (w) => {
        this.weather = w;
        this.city.setFogVisual(this.weather === 'clear' ? 0 : this.fogDensity());
        this.scan();
      },
      onRescan: () => this.scan(),
      onExport: () => this.exportCloud(),
      onPointSize: (s) => this.cloud.setPointSize(s),
      onToggleCloud: (v) => this.cloud.setVisible(v),
      onToggleAutoRotate: (v) => {
        this.controls.autoRotate = v;
        this.controls.autoRotateSpeed = 1.2;
      },
    });
    document.body.appendChild(this.panel.element);

    this.rayDirections = buildRayDirections(this.scanConfig);
    window.addEventListener('resize', this.onResize);
    this.animate();
    // 首帧扫描
    void this.scan();
  }

  private fogDensity(): number {
    return WEATHER_MAP[this.weather].extinction;
  }

  private rebuildRaysAndScan(): void {
    this.rayDirections = buildRayDirections(this.scanConfig);
    void this.scan();
  }

  private async scan(): Promise<void> {
    const token = ++this.scanToken;
    this.panel.setProgress(0, true);
    const result = await runScan(
      this.city,
      this.rayDirections,
      this.scanConfig,
      this.materialParams,
      this.weather,
      (f) => {
        if (token === this.scanToken) this.panel.setProgress(f, true);
      },
    );
    if (token !== this.scanToken) return; // 已被更新的扫描取代
    this.lastResult = result;
    this.cloud.update(result.points);
    this.panel.setProgress(1, false);
    this.panel.setStats({
      ...result.stats,
      highlightCount: this.cloud.highlightCount,
    });
  }

  private exportCloud(): void {
    if (!this.lastResult || this.lastResult.points.length === 0) {
      window.alert('当前没有可导出的点云，请先完成一次扫描');
      return;
    }
    const text = buildPointCloudText(this.lastResult.points, this.scanConfig, this.weather);
    downloadTextFile(exportFileName(this.scanConfig, this.weather), text);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.city.sensor.rotation.y += 0.02;
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.cloud.dispose();
    this.city.dispose();
    this.renderer.dispose();
  }
}

const host = document.getElementById('app');
if (!host) throw new Error('缺少 #app 挂载节点');
const app = new LidarSimApp(host);

// 供调试使用
declare global {
  interface Window {
    lidarApp: LidarSimApp;
  }
}
window.lidarApp = app;

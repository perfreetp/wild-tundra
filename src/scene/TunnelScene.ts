import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Euler,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  RepeatWrapping,
  Scene,
  SpotLight,
  Vector3,
} from 'three';

/** 灯带所在的遮罩图层（用于过曝抑制时保留灯带高光） */
export const MASK_LAYER = 1;

export const TUNNEL_ENTRANCE_Z = 0;
export const TUNNEL_EXIT_Z = -180;
const START_Z = 140;
const END_Z = -260;

export class TunnelScene {
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly car = new Group();

  private readonly camLook = new Vector3(0, 1.5, START_Z - 10);
  private readonly tmpV = new Vector3();
  private readonly tmpLook = new Vector3();

  constructor() {
    this.camera = new PerspectiveCamera(62, 16 / 9, 0.1, 900);
    this.camera.position.set(0, 2.7, START_Z + 9);
    this.buildEnvironment();
    this.buildTunnel();
    this.buildCar();
    this.car.position.set(1.75, 0, START_Z);
  }

  /** 推进车辆与跟随相机 */
  update(dt: number, speedKmh: number, running: boolean): void {
    if (running) {
      this.car.position.z -= (speedKmh / 3.6) * dt;
      if (this.car.position.z < END_Z) this.car.position.z = START_Z;
    }
    const cz = this.car.position.z;
    const k = 1 - Math.exp(-dt * 4);
    this.tmpV.set(this.car.position.x * 0.6, 2.7, cz + 9);
    this.camera.position.lerp(this.tmpV, k);
    this.tmpLook.set(this.car.position.x * 0.8, 1.4, cz - 14);
    this.camLook.lerp(this.tmpLook, k);
    this.camera.lookAt(this.camLook);
  }

  resetCar(): void {
    this.car.position.z = START_Z;
  }

  zone(): string {
    const z = this.car.position.z;
    if (z > TUNNEL_ENTRANCE_Z) return '洞外 · 入口段';
    if (z > TUNNEL_EXIT_Z) return '洞内';
    return '洞外 · 出口段';
  }

  // ---------------------------------------------------------------- 环境

  private buildEnvironment(): void {
    this.scene.background = new Color(0x9ec8ee);
    this.scene.fog = new Fog(0x9ec8ee, 120, 600);

    const sun = new DirectionalLight(0xfff3e0, 3.2);
    sun.position.set(40, 70, 30);
    this.scene.add(sun);
    this.scene.add(new HemisphereLight(0xbcd6ff, 0x50483a, 0.85));

    // 地面
    const ground = new Mesh(
      new PlaneGeometry(900, 900),
      new MeshStandardMaterial({ color: 0x46523c, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.scene.add(ground);

    // 路面
    const roadTex = this.makeRoadTexture();
    const road = new Mesh(
      new PlaneGeometry(10, 430),
      new MeshStandardMaterial({ map: roadTex, roughness: 0.94 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -55);
    this.scene.add(road);

    // 隔音屏障
    const barrierMat = new MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.85 });
    for (const zc of [80, -230]) {
      for (const sx of [-7.4, 7.4]) {
        const wall = new Mesh(new BoxGeometry(0.4, 2.4, 120), barrierMat);
        wall.position.set(sx, 1.2, zc);
        this.scene.add(wall);
      }
    }

    // 树木
    const trunkGeo = new CylinderGeometry(0.18, 0.24, 1.6, 8);
    const crownGeo = new ConeGeometry(1.9, 5.2, 8);
    const trunkMat = new MeshStandardMaterial({ color: 0x5a4230, roughness: 1 });
    const crownMat = new MeshStandardMaterial({ color: 0x2f5d33, roughness: 1 });
    for (let i = 0; i < 48; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (14 + Math.random() * 46);
      const z = 150 - Math.random() * 420;
      if (z < -10 && z > -190) continue; // 不放进隧道
      const s = 0.7 + Math.random() * 0.9;
      const trunk = new Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 0.8 * s, z);
      trunk.scale.setScalar(s);
      const crown = new Mesh(crownGeo, crownMat);
      crown.position.set(x, (1.6 + 2.6) * s, z);
      crown.scale.setScalar(s);
      this.scene.add(trunk, crown);
    }
  }

  private makeRoadTexture(): CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#33363a';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    g.fillStyle = '#c8c9c4';
    g.fillRect(8, 0, 5, 256);
    g.fillRect(243, 0, 5, 256);
    g.fillStyle = '#caa93c';
    g.fillRect(125, 10, 6, 100);
    const tex = new CanvasTexture(c);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(1, 43);
    tex.anisotropy = 8;
    return tex;
  }

  // ---------------------------------------------------------------- 隧道

  private buildTunnel(): void {
    // 拱形洞体（整圆管，下半埋在地面下）
    const tubeGeo = new CylinderGeometry(6, 6, 180, 48, 1, true);
    tubeGeo.rotateX(Math.PI / 2);
    const tube = new Mesh(
      tubeGeo,
      new MeshStandardMaterial({
        map: this.makeTunnelTexture(),
        color: 0x8d9094,
        roughness: 0.92,
        side: BackSide,
      }),
    );
    tube.position.set(0, 0, -90);
    this.scene.add(tube);

    // 照明灯带（两排，贴拱顶两侧，InstancedMesh）
    const stripGeo = new BoxGeometry(0.3, 0.08, 2.4);
    const stripMat = new MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: 0xffe6bd,
      emissiveIntensity: 5,
    });
    const mats: Matrix4[] = [];
    const q = new Quaternion();
    const e = new Euler();
    const one = new Vector3(1, 1, 1);
    for (const side of [-1, 1]) {
      const angle = side * 0.85; // 距拱顶竖直方向的角度
      const x = Math.sin(angle) * 5.7;
      const y = Math.cos(angle) * 5.7;
      for (let z = -4; z >= -176; z -= 4) {
        e.set(0, 0, -angle);
        q.setFromEuler(e);
        mats.push(new Matrix4().compose(new Vector3(x, y, z), q, one));
      }
    }
    const strips = new InstancedMesh(stripGeo, stripMat, mats.length);
    mats.forEach((m, i) => strips.setMatrixAt(i, m));
    strips.layers.enable(MASK_LAYER); // 进入高光保留遮罩
    this.scene.add(strips);

    // 洞内点光源（稀疏，提供实际照明）
    for (let i = 0; i < 8; i++) {
      const p = new PointLight(0xffdfae, 50, 32, 2);
      p.position.set(0, 4.8, -12 - i * 22);
      this.scene.add(p);
    }

    // 洞口门架
    this.buildPortal(TUNNEL_ENTRANCE_Z);
    this.buildPortal(TUNNEL_EXIT_Z);
  }

  private makeTunnelTexture(): CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#8d9094';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    for (let x = 0; x <= 256; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    const tex = new CanvasTexture(c);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(24, 60);
    tex.anisotropy = 8;
    return tex;
  }

  private buildPortal(z: number): void {
    const mat = new MeshStandardMaterial({ color: 0x565a5e, roughness: 0.9 });
    const group = new Group();
    const pillarGeo = new BoxGeometry(1.4, 8, 2);
    for (const sx of [-6.8, 6.8]) {
      const p = new Mesh(pillarGeo, mat);
      p.position.set(sx, 4, z);
      group.add(p);
    }
    const beam = new Mesh(new BoxGeometry(15, 2.4, 2), mat);
    beam.position.set(0, 6.6, z);
    group.add(beam);
    this.scene.add(group);
  }

  // ---------------------------------------------------------------- 车辆

  private buildCar(): void {
    const body = new Mesh(
      new BoxGeometry(1.8, 0.55, 4.2),
      new MeshStandardMaterial({ color: 0x7d1f1f, metalness: 0.5, roughness: 0.35 }),
    );
    body.position.y = 0.62;
    const cabin = new Mesh(
      new BoxGeometry(1.6, 0.5, 2.1),
      new MeshStandardMaterial({ color: 0x1c2126, metalness: 0.3, roughness: 0.2 }),
    );
    cabin.position.set(0, 1.12, 0.3);
    this.car.add(body, cabin);

    const wheelGeo = new CylinderGeometry(0.33, 0.33, 0.26, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    for (const [x, z] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
      const w = new Mesh(wheelGeo, wheelMat);
      w.position.set(x, 0.33, z);
      this.car.add(w);
    }

    const tailMat = new MeshStandardMaterial({ color: 0x220000, emissive: 0xff2211, emissiveIntensity: 2.5 });
    for (const sx of [-0.6, 0.6]) {
      const t = new Mesh(new BoxGeometry(0.35, 0.12, 0.06), tailMat);
      t.position.set(sx, 0.72, 2.12);
      this.car.add(t);
    }
    const headMat = new MeshStandardMaterial({ color: 0x111111, emissive: 0xfff6d8, emissiveIntensity: 4 });
    for (const sx of [-0.6, 0.6]) {
      const h = new Mesh(new BoxGeometry(0.35, 0.14, 0.06), headMat);
      h.position.set(sx, 0.72, -2.12);
      this.car.add(h);
    }

    const spot = new SpotLight(0xfff2cf, 80, 55, 0.5, 0.5, 2);
    spot.position.set(0, 0.9, -1.8);
    spot.target.position.set(0, 0.2, -25);
    this.car.add(spot, spot.target);

    this.scene.add(this.car);
  }
}

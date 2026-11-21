import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSM } from 'three/examples/jsm/csm/CSM.js';

const MAX_FAR = 150; // 级联阴影覆盖的最远距离
const CASCADES = 3;

// 把太阳高度角/方位角转成"从太阳指向场景"的光线方向
function sunDirection(elevationDeg, azimuthDeg) {
  const el = THREE.MathUtils.degToRad(elevationDeg);
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  // 先求太阳所在方向,再取反得到光线方向
  const toSun = new THREE.Vector3(
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az),
  );
  return { toSun, lightDir: toSun.clone().negate() };
}

export function createStreetScene(canvas, params, callbacks = {}) {
  // ---------- 渲染器 / 场景 / 相机 ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCF 才能用 radius 调节采样核
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 500);
  camera.position.set(26, 20, 32);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 6;
  controls.maxDistance = 140;

  // ---------- 环境光 ----------
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.55);
  scene.add(hemi);

  // ---------- 级联阴影(方向光 = 太阳) ----------
  const { lightDir } = sunDirection(params.elevation, params.azimuth);
  const csm = new CSM({
    camera,
    parent: scene,
    cascades: CASCADES,
    maxFar: MAX_FAR,
    mode: 'practical',
    shadowMapSize: params.mapSize,
    lightDirection: lightDir.clone(),
    lightIntensity: 2.4,
    lightMargin: 30,
    lightFar: 200, // 场景不大,收紧光源远平面,阴影深度精度更高
    shadowBias: 0,
  });
  csm.fade = true; // 级联之间平滑过渡

  // 让每一级级联用不同分辨率:近高远低(远的精度低)
  function applyCascadeSizes(base) {
    const sizes = [base, Math.max(256, base >> 1), Math.max(256, base >> 2)];
    csm.lights.forEach((light, i) => {
      light.shadow.mapSize.set(sizes[i], sizes[i]);
      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    });
    csm.shadowMapSize = base;
  }

  function applyShadowTuning() {
    // 粗糙的地面会让影子边缘更散(教学模拟):粗糙度放大有效采样核
    const radius = params.kernel * (0.5 + params.groundRough);
    csm.lights.forEach((light) => {
      light.shadow.bias = params.bias;
      light.shadow.normalBias = params.normalBias;
      light.shadow.radius = radius;
    });
    lampLights.forEach((light) => {
      light.shadow.bias = params.bias * 0.5;
      light.shadow.normalBias = params.normalBias;
      light.shadow.radius = radius;
    });
  }

  // ---------- 材质(都要交给 CSM 打补丁) ----------
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x77b255, roughness: params.groundRough });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x5b5b60, roughness: 0.9 });
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.95 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2e3c6, roughness: params.wallRough });
  const wallMat2 = new THREE.MeshStandardMaterial({ color: 0xd9e6f2, roughness: params.wallRough });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc96f4a, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3e8e41, roughness: 0.85 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x44484f, roughness: 0.6, metalness: 0.4 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c0, emissive: 0xffca66, emissiveIntensity: 1.2, roughness: 0.4,
  });
  const personMats = [0xe74c3c, 0x3498db, 0xf1c40f, 0x9b59b6].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }),
  );

  const allMaterials = [
    groundMat, roadMat, walkMat, wallMat, wallMat2, roofMat,
    trunkMat, leafMat, poleMat, bulbMat, ...personMats,
  ];
  allMaterials.forEach((m) => csm.setupMaterial(m));

  // ---------- 地面 / 马路 / 人行道 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.BoxGeometry(160, 0.1, 8), roadMat);
  road.position.y = 0.05;
  road.receiveShadow = true;
  scene.add(road);

  for (const z of [-5.5, 5.5]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(160, 0.14, 3), walkMat);
    walk.position.set(0, 0.07, z);
    walk.receiveShadow = true;
    scene.add(walk);
  }

  // ---------- 小房子 ----------
  function makeHouse(x, z, mat, w = 6, h = 4, d = 5) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.6, 4), roofMat);
    roof.position.y = h + h * 0.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }
  makeHouse(-28, -12, wallMat);
  makeHouse(-10, -13, wallMat2, 5, 3.4, 4.5);
  makeHouse(10, -12, wallMat, 7, 4.6, 5.5);
  makeHouse(28, -13, wallMat2);
  makeHouse(-20, 12, wallMat2, 5.5, 3.8, 5);
  makeHouse(0, 13, wallMat);
  makeHouse(20, 12, wallMat2, 6.5, 4.2, 5);

  // ---------- 小树 ----------
  function makeTree(x, z, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.24 * s, 1.4 * s, 8), trunkMat);
    trunk.position.y = 0.7 * s;
    trunk.castShadow = true;
    g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * s, 1), leafMat);
    crown.position.y = 2 * s;
    crown.castShadow = true;
    g.add(crown);
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }
  makeTree(-36, 6, 1.2); makeTree(-16, -6.5, 1); makeTree(-4, 7, 0.9);
  makeTree(14, -7, 1.1); makeTree(34, 6.5, 1); makeTree(38, -8, 1.3);
  makeTree(-34, -7, 0.8); makeTree(8, 8, 1);

  // ---------- 小人(可拖动) ----------
  const people = [];
  const personStarts = [[-6, 1.5], [-1, -2], [4, 2], [9, -1.5]];
  personStarts.forEach(([x, z], i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 12), personMats[i]);
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), personMats[i]);
    head.position.y = 1.12;
    head.castShadow = true;
    g.add(head);
    g.position.set(x, 0, z);
    g.userData.isPerson = true;
    g.userData.index = i;
    scene.add(g);
    people.push(g);
  });

  // ---------- 路灯(点光源,立方体贴图阴影) ----------
  const lampLights = [];
  const lampBulbs = [];
  [[-14, 4.8], [14, -4.8]].forEach(([x, z], i) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4, 10), poleMat);
    pole.position.y = 2;
    pole.castShadow = true;
    g.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), bulbMat.clone());
    bulb.position.y = 4.1;
    g.add(bulb);
    csm.setupMaterial(bulb.material);
    const light = new THREE.PointLight(0xffc06a, 30, 26, 2);
    light.position.set(0, 4.1, 0);
    light.castShadow = true; // 点光源阴影自动使用立方体贴图
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 0.3;
    light.shadow.camera.far = 26;
    g.add(light);
    g.position.set(x, 0, z);
    scene.add(g);
    lampLights.push(light);
    lampBulbs.push(bulb);
  });

  // ---------- 太阳小球 + 天空 ----------
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(4, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffdf5e, fog: false }),
  );
  scene.add(sunBall);

  const skyDay = new THREE.Color(0x87ceeb);
  const skyDusk = new THREE.Color(0xff9a5c);
  const sunDay = new THREE.Color(0xffdf5e);
  const sunDusk = new THREE.Color(0xff7b3a);

  function updateSunAndSky() {
    const { toSun, lightDir } = sunDirection(params.elevation, params.azimuth);
    csm.lightDirection.copy(lightDir);
    sunBall.position.copy(toSun).multiplyScalar(170);
    const t = 1 - (params.elevation - 10) / 70; // 0=正午 1=傍晚
    scene.background.copy(skyDay).lerp(skyDusk, t * 0.85);
    sunBall.material.color.copy(sunDay).lerp(sunDusk, t);
    hemi.intensity = 0.55 - t * 0.25;
    csm.lights.forEach((l) => { l.intensity = 2.4 - t * 0.9; });
  }

  // ---------- 调试视图材质 ----------
  // 级联分层染色:按视距落在哪一级级联染不同颜色
  const cascadeDebugMat = new THREE.ShaderMaterial({
    uniforms: { uSplits: { value: new THREE.Vector3(30, 70, MAX_FAR) } },
    vertexShader: /* glsl */`
      varying float vViewZ;
      varying vec3 vNormal;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewZ = -mv.z;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSplits;
      varying float vViewZ;
      varying vec3 vNormal;
      void main() {
        vec3 c = vViewZ < uSplits.x
          ? vec3(0.95, 0.35, 0.35)   // 第1级(最近,最清晰):红
          : vViewZ < uSplits.y
            ? vec3(0.35, 0.85, 0.45) // 第2级:绿
            : vec3(0.4, 0.55, 0.95); // 第3级(最远,最粗):蓝
        float shade = 0.55 + 0.45 * max(dot(vNormal, normalize(vec3(0.4, 0.9, 0.3))), 0.0);
        gl_FragColor = vec4(c * shade, 1.0);
      }`,
  });

  // 深度视图:近白远黑
  const depthDebugMat = new THREE.ShaderMaterial({
    uniforms: { uMax: { value: MAX_FAR } },
    vertexShader: cascadeDebugMat.vertexShader,
    fragmentShader: /* glsl */`
      uniform float uMax;
      varying float vViewZ;
      void main() {
        float d = clamp(vViewZ / uMax, 0.0, 1.0);
        gl_FragColor = vec4(vec3(1.0 - d), 1.0);
      }`,
  });

  // 阴影贴图视角:从某一级级联的光源相机看出去的深度
  const lightPovMat = new THREE.ShaderMaterial({
    uniforms: { uNear: { value: 1 }, uFar: { value: 200 } },
    vertexShader: cascadeDebugMat.vertexShader,
    fragmentShader: /* glsl */`
      uniform float uNear;
      uniform float uFar;
      varying float vViewZ;
      void main() {
        float d = clamp((vViewZ - uNear) / (uFar - uNear), 0.0, 1.0);
        gl_FragColor = vec4(vec3(1.0 - d), 1.0);
      }`,
  });

  // ---------- 拖动小人 ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let dragging = null;

  function setPointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointerdown', (e) => {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(people, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.isPerson) obj = obj.parent;
      if (obj) {
        dragging = obj;
        controls.enabled = false;
        canvas.style.cursor = 'grabbing';
        canvas.setPointerCapture(e.pointerId);
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (dragging) {
      raycaster.setFromCamera(pointer, camera);
      const p = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, p)) {
        dragging.position.set(
          THREE.MathUtils.clamp(p.x, -55, 55),
          0,
          THREE.MathUtils.clamp(p.z, -30, 30),
        );
      }
    } else {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(people, true);
      canvas.style.cursor = hits.length > 0 ? 'grab' : '';
    }
  });
  const endDrag = () => {
    if (dragging) {
      dragging = null;
      controls.enabled = true;
      canvas.style.cursor = '';
      callbacks.onPeopleMoved?.();
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---------- 尺寸自适应 ----------
  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    csm.updateFrustums();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ---------- 参数同步(由外部调用) ----------
  const api = {
    applySun: updateSunAndSky,
    applyShadowQuality() {
      applyCascadeSizes(params.mapSize);
      applyShadowTuning();
    },
    applyMaterials() {
      groundMat.roughness = params.groundRough;
      wallMat.roughness = params.wallRough;
      wallMat2.roughness = params.wallRough;
      applyShadowTuning(); // 粗糙度联动影子边缘发散
    },
    applyLamps() {
      lampLights.forEach((l, i) => { l.visible = params.lamps[i]; });
      lampBulbs.forEach((b, i) => {
        b.material.emissiveIntensity = params.lamps[i] ? 1.2 : 0.05;
      });
    },
    dispose() {
      ro.disconnect();
      renderer.dispose();
    },
  };

  applyCascadeSizes(params.mapSize);
  applyShadowTuning();
  updateSunAndSky();
  api.applyLamps();

  // ---------- 主循环 ----------
  const splitVec = new THREE.Vector3();
  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    controls.update();
    csm.update();

    // 调试视图:整屏覆盖材质
    if (params.debugView === 'cascades') {
      // csm.breaks 是 0~1 的比例,乘回 maxFar 才是视距
      const b = csm.breaks;
      splitVec.set((b[0] ?? 0.2) * MAX_FAR, (b[1] ?? 0.5) * MAX_FAR, MAX_FAR);
      cascadeDebugMat.uniforms.uSplits.value.copy(splitVec);
      scene.overrideMaterial = cascadeDebugMat;
    } else if (params.debugView === 'depth') {
      scene.overrideMaterial = depthDebugMat;
    } else {
      scene.overrideMaterial = null;
    }

    renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    // 调试视图:右下角小窗显示"阴影贴图"(从该级光源相机看到的深度)
    if (params.debugView === 'shadowmap') {
      const light = csm.lights[params.debugCascade] ?? csm.lights[0];
      const cam = light.shadow.camera;
      lightPovMat.uniforms.uNear.value = cam.near;
      lightPovMat.uniforms.uFar.value = cam.far;
      const size = Math.min(260, canvas.clientWidth * 0.3, canvas.clientHeight * 0.4);
      const x = canvas.clientWidth - size - 12;
      renderer.clearDepth();
      renderer.setScissorTest(true);
      renderer.setScissor(x, 12, size, size);
      renderer.setViewport(x, 12, size, size);
      const prevOverride = scene.overrideMaterial;
      scene.overrideMaterial = lightPovMat;
      renderer.render(scene, cam);
      scene.overrideMaterial = prevOverride;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
  }
  tick();

  // 暴露给调试/自动化测试
  window.__shadowStreet = { people, camera, csm, renderer };

  return api;
}

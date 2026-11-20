import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { createOrganGeometry, geometryToBuffers } from '../organs/organFactory'
import type {
  FrameInputMessage,
  FrameResultMessage,
  HardnessProfile,
  InitDoneMessage,
  OrganDescriptor,
} from '../shared/types'
import DeformWorker from '../workers/deformWorker.ts?worker'

export interface ViewportStats {
  fps: number
  bvhMs: number
  workerMs: number
  contactDepth: number
  maxDeformation: number
  contact: boolean
  faceIndex: number
  boneCount: number
}

interface ContactState {
  active: boolean
  point: THREE.Vector3
  normal: THREE.Vector3
  depth: number
  faceIndex: number
}

const TRAIL_LIFE_MS = 1400
const TRAIL_MAX = 240
const HUD_INTERVAL_MS = 100

/**
 * 视口场景管理器：
 * - three.js 渲染 / OrbitControls / 探针拖拽
 * - three-mesh-bvh 加速 closestPoint 求交（命中三角形、法线、接触深度）
 * - Worker 形变计算编排（双缓冲零拷贝）
 * - 线框叠加、探针残影、HUD 统计
 */
export class SceneManager {
  private container: HTMLElement
  private onStats: (s: ViewportStats) => void

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private controls!: OrbitControls
  private raycaster = new THREE.Raycaster()

  private organMesh: THREE.Mesh | null = null
  private wireMesh: THREE.Mesh | null = null
  private bvh: MeshBVH | null = null
  private organRadius = 1

  private probe!: THREE.Mesh
  private probeRadius = 0.15
  private probeMaterial!: THREE.MeshStandardMaterial
  private contactMarker!: THREE.Mesh

  private trail!: THREE.Points
  private trailPositions!: Float32Array
  private trailAges!: Float32Array
  private trailBorn: number[] = []
  private trailCount = 0
  private lastTrailPush = 0
  private trailMaterial!: THREE.ShaderMaterial

  private worker: Worker | null = null
  private ready = false
  private busy = false
  /** 双缓冲：空闲两个槽，发送时取一个，回传后归还 */
  private freeBuffers: ArrayBuffer[] = []
  private vertexCount = 0
  private boneCount = 0
  private profile: HardnessProfile | null = null

  private contact: ContactState = {
    active: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(0, 1, 0),
    depth: 0,
    faceIndex: -1,
  }

  private dragging = false
  private dragPlane = new THREE.Plane()
  private dragOffset = new THREE.Vector3()
  private pointerNdc = new THREE.Vector2()
  private lastPointerY = 0
  private depthDrag = false

  private rafId = 0
  private lastFrameTime = 0
  private fpsEma = 60
  private bvhMsEma = 0
  private workerMsEma = 0
  private lastHudEmit = 0
  private resizeObserver: ResizeObserver
  private disposed = false

  // 命中点临时对象，避免每帧分配
  private hitInfo = { point: new THREE.Vector3(), distance: 0, faceIndex: 0 }
  private triA = new THREE.Vector3()
  private triB = new THREE.Vector3()
  private triC = new THREE.Vector3()
  private triEdge1 = new THREE.Vector3()
  private triEdge2 = new THREE.Vector3()
  private triNormal = new THREE.Vector3()
  private tmpVec = new THREE.Vector3()
  private probeRay = new THREE.Ray()
  private rayDir = new THREE.Vector3()

  constructor(container: HTMLElement, onStats: (s: ViewportStats) => void) {
    this.container = container
    this.onStats = onStats
    this.initRenderer()
    this.initScene()
    this.initProbe()
    this.initTrail()
    this.bindPointerEvents()
    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(container)
    this.lastFrameTime = performance.now()
    this.animate()
    // 调试/自动化钩子：暴露只读探针状态与内部对象（生产环境保留，无副作用）
    ;(window as unknown as Record<string, unknown>).__viewport = {
      getProbePosition: () => this.probe.position.clone(),
      getContact: () => ({ ...this.contact, point: this.contact.point.clone(), normal: this.contact.normal.clone() }),
      getOrganMesh: () => this.organMesh,
      getCamera: () => this.camera,
      screenOfProbe: () => this.projectToScreen(this.probe.position),
      screenOfOrganCenter: () =>
        this.organMesh ? this.projectToScreen(this.organMesh.geometry.boundingSphere!.center) : null,
      /** 自动化/调试：直接设置探针世界坐标 */
      setProbePosition: (x: number, y: number, z: number) => this.probe.position.set(x, y, z),
      /** 自动化/调试：读取器官包围球 */
      getOrganSphere: () => {
        const s = this.organMesh?.geometry.boundingSphere
        return s ? { center: s.center.toArray(), radius: s.radius } : null
      },
      /** 自动化/调试：内部接触状态 */
      getContactDebug: () => {
        const c = this.contact
        return {
          active: c.active,
          depth: c.depth,
          faceIndex: c.faceIndex,
          probeRadius: this.probeRadius,
          probePos: this.probe.position.toArray(),
        }
      },
    }
  }

  /** 世界坐标 → 画布 CSS 像素坐标（供自动化测试与调试） */
  private projectToScreen(world: THREE.Vector3): string {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const proj = world.clone().project(this.camera)
    return JSON.stringify({
      x: rect.x + (proj.x * 0.5 + 0.5) * rect.width,
      y: rect.y + (-proj.y * 0.5 + 0.5) * rect.height,
    })
  }

  // ---------- 初始化 ----------

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'
    this.container.appendChild(this.renderer.domElement)
  }

  private initScene(): void {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0d1117)
    this.scene.fog = new THREE.Fog(0x0d1117, 9, 22)

    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.05, 100)
    this.camera.position.set(3.2, 2.2, 4.4)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 14

    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x2a2018, 1.1)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 6, 5)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.7)
    fill.position.set(-5, -2, -3)
    this.scene.add(fill)

    const grid = new THREE.GridHelper(12, 24, 0x30363d, 0x21262d)
    grid.position.y = -1.8
    this.scene.add(grid)
  }

  private initProbe(): void {
    this.probeMaterial = new THREE.MeshStandardMaterial({
      color: 0x46d7f5,
      emissive: 0x0e6f86,
      emissiveIntensity: 0.9,
      metalness: 0.35,
      roughness: 0.25,
    })
    this.probe = new THREE.Mesh(new THREE.SphereGeometry(this.probeRadius, 32, 24), this.probeMaterial)
    this.probe.position.set(1.6, 0.6, 1.6)
    this.scene.add(this.probe)

    // 探针外圈金属环，强化“器械”观感
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(this.probeRadius * 1.18, this.probeRadius * 0.06, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0xd8e3ec, metalness: 0.9, roughness: 0.2 }),
    )
    ring.rotation.x = Math.PI / 2.4
    this.probe.add(ring)

    this.contactMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.09, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    this.contactMarker.visible = false
    this.scene.add(this.contactMarker)
  }

  private initTrail(): void {
    this.trailPositions = new Float32Array(TRAIL_MAX * 3)
    this.trailAges = new Float32Array(TRAIL_MAX)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3))
    geo.setAttribute('aAge', new THREE.BufferAttribute(this.trailAges, 1))
    geo.setDrawRange(0, 0)

    this.trailMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uLife: { value: TRAIL_LIFE_MS },
        uSize: { value: 26.0 },
        uColor: { value: new THREE.Color(0x46d7f5) },
      },
      vertexShader: /* glsl */ `
        attribute float aAge;
        uniform float uLife;
        uniform float uSize;
        varying float vAlpha;
        void main() {
          float t = clamp(aAge / uLife, 0.0, 1.0);
          vAlpha = 1.0 - t;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (1.0 - t * 0.6) * (3.2 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float soft = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(uColor, soft * vAlpha * 0.75);
        }
      `,
    })
    this.trail = new THREE.Points(geo, this.trailMaterial)
    this.trail.frustumCulled = false
    this.scene.add(this.trail)
  }

  // ---------- 器官加载 / Worker 生命周期 ----------

  async loadOrgan(desc: OrganDescriptor): Promise<void> {
    this.ready = false
    this.busy = false
    this.worker?.terminate()
    this.worker = null
    this.disposeOrgan()
    this.resetTrail()

    const geo = createOrganGeometry(desc)
    this.organRadius = geo.boundingSphere!.radius
    this.vertexCount = (geo.attributes.position as THREE.BufferAttribute).count
    this.probeRadius = Math.max(0.09, this.organRadius * 0.11)
    this.probe.scale.setScalar(this.probeRadius / 0.15)

    // BVH 加速结构（变形后用 refit 增量更新，不重建）
    this.bvh = new MeshBVH(geo, { maxLeafTris: 4 })

    const material = new THREE.MeshStandardMaterial({
      color: desc.color,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.FrontSide,
    })
    this.organMesh = new THREE.Mesh(geo, material)
    this.organMesh.raycast = acceleratedRaycast
    this.scene.add(this.organMesh)

    // 线框叠加：共享同一 geometry，顶点位移自动同步
    this.wireMesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: 0x9fd8ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    )
    this.wireMesh.visible = false
    this.scene.add(this.wireMesh)

    // 取景
    this.controls.target.copy(geo.boundingSphere!.center)
    const dist = this.organRadius * 3.1
    this.camera.position.set(dist * 0.72, dist * 0.5, dist)
    this.camera.near = dist / 40
    this.camera.far = dist * 30
    this.camera.updateProjectionMatrix()
    this.controls.update()

    // 初始化 Worker：传输静止顶点与索引，内部预计算蒙皮权重
    const buffers = geometryToBuffers(geo)
    const worker = new DeformWorker()
    this.worker = worker
    const initDone = new Promise<InitDoneMessage>((resolve) => {
      worker.onmessage = (ev: MessageEvent<InitDoneMessage | FrameResultMessage>) => {
        const msg = ev.data
        if (msg.type === 'initDone') {
          resolve(msg)
        } else {
          this.onFrameResult(msg)
        }
      }
    })

    const byteSize = this.vertexCount * 3 * 4
    this.freeBuffers = [new ArrayBuffer(byteSize), new ArrayBuffer(byteSize)]

    worker.postMessage(
      {
        type: 'init',
        organId: desc.id,
        restPositions: buffers.restPositions.buffer,
        indices: buffers.indices.buffer,
        center: buffers.center,
        radius: buffers.radius,
        vertexCount: this.vertexCount,
      },
      [buffers.restPositions.buffer, buffers.indices.buffer],
    )

    const done = await initDone
    this.boneCount = done.boneCount
    this.ready = true
  }

  private onFrameResult(msg: FrameResultMessage): void {
    this.busy = false
    this.workerMsEma = this.workerMsEma * 0.9 + msg.computeMs * 0.1
    this.lastMaxDeformation = msg.maxDeformation
    if (!this.organMesh) {
      return
    }
    const geo = this.organMesh.geometry
    const attr = geo.attributes.position as THREE.BufferAttribute
    // 新 Float32Array 只是对回传缓冲的零拷贝视图，set 进几何属性数组
    ;(attr.array as Float32Array).set(new Float32Array(msg.positions))
    attr.needsUpdate = true
    // 光照法线与 BVH 增量更新
    geo.computeVertexNormals()
    this.bvh?.refit()

    // 归还在途缓冲，双缓冲继续轮换
    this.freeBuffers.push(msg.positions)
  }

  // ---------- 对外控制 ----------

  setHardness(profile: HardnessProfile): void {
    this.profile = profile
  }

  setWireframe(visible: boolean): void {
    if (this.wireMesh) this.wireMesh.visible = visible
  }

  getBoneCount(): number {
    return this.boneCount
  }

  // ---------- 探针拖拽 ----------

  private bindPointerEvents(): void {
    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
  }

  private updateNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.updateNdc(e)
    this.raycaster.setFromCamera(this.pointerNdc, this.camera)
    const hit = this.raycaster.intersectObject(this.probe, false)
    if (hit.length === 0) return
    this.dragging = true
    this.controls.enabled = false
    this.lastPointerY = e.clientY
    // Shift 按住：沿视线方向推近/拉远（用于把探针压入器官内部）
    this.depthDrag = e.shiftKey
    if (!this.depthDrag) {
      // 普通拖拽平面：过探针中心、面向相机
      const normal = this.camera.getWorldDirection(new THREE.Vector3())
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.probe.position)
      this.tmpVec.copy(this.probe.position).sub(hit[0].point)
      this.dragOffset.copy(this.tmpVec)
    }
    this.renderer.domElement.style.cursor = 'grabbing'
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) {
      this.updateNdc(e)
      this.raycaster.setFromCamera(this.pointerNdc, this.camera)
      const hover = this.raycaster.intersectObject(this.probe, false).length > 0
      this.renderer.domElement.style.cursor = hover ? 'grab' : 'default'
      return
    }
    this.updateNdc(e)
    if (this.depthDrag) {
      // 纵向鼠标位移 → 沿相机视线移动，上拖推近、下拖拉远
      const dy = e.clientY - this.lastPointerY
      this.lastPointerY = e.clientY
      const viewDir = new THREE.Vector3()
      this.camera.getWorldDirection(viewDir)
      const scale = this.organRadius * 0.006
      this.probe.position.addScaledVector(viewDir, -dy * scale)
      return
    }
    this.lastPointerY = e.clientY
    this.raycaster.setFromCamera(this.pointerNdc, this.camera)
    const target = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.dragPlane, target)) {
      this.probe.position.copy(target.add(this.dragOffset))
    }
  }

  private onPointerUp = (): void => {
    if (!this.dragging) return
    this.dragging = false
    this.controls.enabled = true
    this.renderer.domElement.style.cursor = 'default'
  }

  // ---------- BVH 接触求交 ----------

  private updateContact(): void {
    const c = this.contact
    if (!this.bvh || !this.organMesh) {
      c.active = false
      return
    }
    const probePos = this.probe.position
    const t0 = performance.now()
    const center = this.organMesh.geometry.boundingSphere!.center

    // 阶段 1：BVH 射线求交判定内外——从探针中心沿“离开器官中心”方向发射射线，
    // 命中距离小于器官半径即说明探针位于封闭网格内部
    this.rayDir.subVectors(probePos, center)
    if (this.rayDir.lengthSq() < 1e-8) this.rayDir.set(1, 0, 0)
    else this.rayDir.normalize()
    this.probeRay.set(probePos, this.rayDir)
    // 从内部向外发射命中的是三角形背面，必须用 DoubleSide 否则全部被面剔除
    const rayHit = this.bvh.raycastFirst(this.probeRay, THREE.DoubleSide)
    const inside = !!rayHit && rayHit.distance < this.organRadius

    // 阶段 2：BVH 最近点查询。接触点始终取离探针最近的表面点（入口侧），
    // 这样凹陷发生在器械真正压入的位置，而不是射线穿出的远侧面
    const closest = this.bvh.closestPointToPoint(
      probePos,
      this.hitInfo,
      0,
      this.organRadius * 2.5,
    )
    if (!closest) {
      c.active = false
      this.contactMarker.visible = false
      this.bvhMsEma = this.bvhMsEma * 0.9 + (performance.now() - t0) * 0.1
      return
    }
    const surfacePoint = closest.point
    const faceIndex = closest.faceIndex
    this.bvhMsEma = this.bvhMsEma * 0.9 + (performance.now() - t0) * 0.1

    // 由命中三角形计算几何法线，并统一翻转为“背离器官中心”的外法线，
    // 保证 Worker 的凹陷位移始终指向器官内部
    const geo = this.organMesh.geometry
    const index = geo.getIndex()!
    const attr = geo.attributes.position as THREE.BufferAttribute
    const base = faceIndex * 3
    this.triA.fromBufferAttribute(attr, index.getX(base))
    this.triB.fromBufferAttribute(attr, index.getX(base + 1))
    this.triC.fromBufferAttribute(attr, index.getX(base + 2))
    this.triEdge1.subVectors(this.triC, this.triA)
    this.triEdge2.subVectors(this.triB, this.triA)
    this.triNormal.crossVectors(this.triEdge1, this.triEdge2).normalize()
    this.tmpVec.subVectors(surfacePoint, center)
    if (this.triNormal.dot(this.tmpVec) < 0) this.triNormal.negate()

    // 接触深度：外部 = 探针半径 − 表面间隙；内部 = 探针半径 + 侵入深度
    const depth = inside
      ? this.probeRadius + rayHit!.distance
      : this.probeRadius - closest.distance
    const touchBand = this.probeRadius + this.organRadius * 0.04
    c.active = inside || closest.distance < touchBand
    c.point.copy(surfacePoint)
    c.normal.copy(this.triNormal)
    c.depth = Math.max(0, depth)
    c.faceIndex = faceIndex

    // 接触标记环
    if (c.active && c.depth > 1e-4) {
      this.contactMarker.visible = true
      this.contactMarker.position.copy(surfacePoint).addScaledVector(this.triNormal, 0.008)
      this.contactMarker.lookAt(this.tmpVec.copy(surfacePoint).add(this.triNormal))
      const pulse = 1 + 0.18 * Math.sin(performance.now() * 0.012)
      this.contactMarker.scale.setScalar(pulse)
      this.probeMaterial.emissive.setHex(0xff7a1a)
      this.probeMaterial.emissiveIntensity = 1.2
    } else {
      this.contactMarker.visible = false
      this.probeMaterial.emissive.setHex(0x0e6f86)
      this.probeMaterial.emissiveIntensity = 0.9
    }
  }

  // ---------- 残影 ----------

  private pushTrail(now: number): void {
    if (this.trailCount >= TRAIL_MAX) {
      // 满了就整体前移，丢弃最旧点
      const shift = 24
      this.trailPositions.copyWithin(0, shift * 3, TRAIL_MAX * 3)
      this.trailAges.copyWithin(0, shift, TRAIL_MAX)
      this.trailBorn.splice(0, shift)
      this.trailCount = TRAIL_MAX - shift
    }
    const i = this.trailCount
    this.trailPositions[i * 3] = this.contact.point.x
    this.trailPositions[i * 3 + 1] = this.contact.point.y
    this.trailPositions[i * 3 + 2] = this.contact.point.z
    this.trailAges[i] = 0
    this.trailBorn.push(now)
    this.trailCount++
    this.lastTrailPush = now
  }

  private updateTrail(now: number): void {
    if (this.contact.active && this.contact.depth > 1e-4 && now - this.lastTrailPush > 28) {
      this.pushTrail(now)
    }
    if (this.trailCount === 0) return
    // 原地压缩，移除超过寿命的点；aAge 写入“已存活毫秒”供 shader 淡出
    let alive = 0
    for (let i = 0; i < this.trailCount; i++) {
      const born = this.trailBorn[i]
      if (now - born < TRAIL_LIFE_MS) {
        if (alive !== i) {
          this.trailPositions[alive * 3] = this.trailPositions[i * 3]
          this.trailPositions[alive * 3 + 1] = this.trailPositions[i * 3 + 1]
          this.trailPositions[alive * 3 + 2] = this.trailPositions[i * 3 + 2]
          this.trailBorn[alive] = born
        }
        this.trailAges[alive] = now - born
        alive++
      }
    }
    this.trailBorn.length = alive
    this.trailCount = alive
    const geo = this.trail.geometry
    geo.setDrawRange(0, this.trailCount)
    ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
    ;(geo.attributes.aAge as THREE.BufferAttribute).needsUpdate = true
  }

  private resetTrail(): void {
    this.trailCount = 0
    this.trailBorn.length = 0
    this.trail.geometry.setDrawRange(0, 0)
  }

  // ---------- 主循环 ----------

  private animate = (): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.animate)
    const now = performance.now()
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1)
    this.lastFrameTime = now
    if (dt > 0) this.fpsEma = this.fpsEma * 0.92 + (1 / dt) * 0.08

    this.controls.update()
    this.updateContact()
    this.updateTrail(now)
    this.dispatchFrame(dt)

    this.renderer.render(this.scene, this.camera)
    this.emitStats(now)
  }

  private dispatchFrame(dt: number): void {
    if (!this.ready || this.busy || !this.worker || !this.profile) return
    const out = this.freeBuffers.pop()
    if (!out) return
    this.busy = true
    const c = this.contact
    const msg: FrameInputMessage = {
      type: 'frame',
      dt,
      contact: c.active && c.depth > 1e-4,
      pointX: c.point.x,
      pointY: c.point.y,
      pointZ: c.point.z,
      normalX: c.normal.x,
      normalY: c.normal.y,
      normalZ: c.normal.z,
      depth: c.depth,
      profile: this.profile,
      outputBuffer: out,
    }
    this.worker.postMessage(msg, [out])
  }

  private emitStats(now: number): void {
    if (now - this.lastHudEmit < HUD_INTERVAL_MS) return
    this.lastHudEmit = now
    // 最大形变从 Worker 最近一次结果读取（onFrameResult 中保存）
    this.onStats({
      fps: this.fpsEma,
      bvhMs: this.bvhMsEma,
      workerMs: this.workerMsEma,
      contactDepth: this.contact.active ? this.contact.depth : 0,
      maxDeformation: this.lastMaxDeformation,
      contact: this.contact.active,
      faceIndex: this.contact.faceIndex,
      boneCount: this.boneCount,
    })
  }

  private lastMaxDeformation = 0

  private handleResize(): void {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private disposeOrgan(): void {
    if (this.organMesh) {
      this.scene.remove(this.organMesh)
      this.organMesh.geometry.dispose()
      ;(this.organMesh.material as THREE.Material).dispose()
      this.organMesh = null
    }
    if (this.wireMesh) {
      this.scene.remove(this.wireMesh)
      ;(this.wireMesh.material as THREE.Material).dispose()
      this.wireMesh = null
    }
    this.bvh = null
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.resizeObserver.disconnect()
    this.worker?.terminate()
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.controls.dispose()
    this.disposeOrgan()
    this.trail.geometry.dispose()
    this.trailMaterial.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

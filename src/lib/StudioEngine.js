// ============================================================
// StudioEngine.js — Babylon.js 场景与全部 3D 交互
// ============================================================
import {
  Engine, Scene, ArcRotateCamera, Vector3, Matrix, Plane, Color3, Color4,
  MeshBuilder, Mesh, StandardMaterial, VertexData, TransformNode,
  HemisphericLight, DirectionalLight, ShadowGenerator,
  PointerEventTypes, CSG, Viewport, Tools,
} from '@babylonjs/core'
import {
  GRID, SNAP_ENDPOINT, snapGrid, dist2, drawSnap, isClosed,
  buildElements, sampleContour, buildExtrude, buildRevolve,
  profileOnOneSide, resizeEdge, clamp,
} from './geometry.js'
import { state, BLOCK_COLORS } from '../composables/useStudio.js'

export class StudioEngine {
  constructor(canvas) {
    this.canvas = canvas
    // 显式锁定 WebGL2/1,避免部分环境先尝试 WebGPU 失败后中断
    this.engine = new Engine(canvas, true, {
      stencil: true,
      preserveDrawingBuffer: true,
      adaptToDeviceRatio: true,
    }, true)
    this.scene = new Scene(this.engine)
    this.scene.clearColor = Color4.FromHexString('#f7f3eaFF')

    this.#initCamera()
    this.#initLights()
    this.#initGround()
    this.#initLayers()
    this.#initPointer()

    this.pickers = []          // 可点选标记 mesh
    this.sketchMeshes = []     // 草图辅助 mesh(标记/手柄/转轴),重建时统一释放
    this.dragging = null       // 'depth' | 'angle' | 'block'
    this.downXY = null
    this.axisArmed = false
    this.collisionTimer = null
    this.labelsDirty = true
    this.camSig = ''
    this.camAnim = null
    this.blockSeq = 0

    this.engine.runRenderLoop(() => {
      this.#tickCameraAnim()
      this.scene.render()
      this.#syncLabels()
    })
    window.addEventListener('resize', this.#onResize)
  }

  // ---------------------------------------------------------- 基础场景
  #initCamera() {
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 0.95, 19, new Vector3(0, 0.6, 0), this.scene)
    cam.attachControl(this.canvas, true)
    cam.lowerRadiusLimit = 5
    cam.upperRadiusLimit = 42
    cam.lowerBetaLimit = 0.06
    cam.upperBetaLimit = 1.55
    cam.panningSensibility = 0
    cam.wheelDeltaPercentage = 0.012
    cam.minZ = 0.1
    this.cam = cam
  }

  #initLights() {
    const h = new HemisphericLight('hemi', new Vector3(0.3, 1, 0.2), this.scene)
    h.intensity = 0.85
    h.groundColor = Color3.FromHexString('#e8dfcc')
    const d = new DirectionalLight('dir', new Vector3(-0.6, -1, -0.4), this.scene)
    d.intensity = 0.75
    this.shadow = new ShadowGenerator(1024, d)
    this.shadow.useBlurExponentialShadowMap = true
    this.shadow.blurScale = 2
  }

  #initGround() {
    const g = MeshBuilder.CreateGround('ground', { width: 40, height: 40, subdivisions: 2 }, this.scene)
    const mat = new StandardMaterial('groundMat', this.scene)
    mat.diffuseColor = Color3.FromHexString('#fbf8f1')
    mat.specularColor = Color3.Black()
    g.material = mat
    g.receiveShadows = true
    this.ground = g

    // 网格线
    const lines = [], colors = []
    const R = 10
    const minor = Color4.FromHexString('#d8d2c2FF')
    const major = Color4.FromHexString('#bdb5a1FF')
    for (let i = -R * 2; i <= R * 2; i++) {
      const v = i * GRID
      const c = i % 2 === 0 ? major : minor
      lines.push([new Vector3(-R, 0.012, v), new Vector3(R, 0.012, v)])
      colors.push([c, c])
      lines.push([new Vector3(v, 0.012, -R), new Vector3(v, 0.012, R)])
      colors.push([c, c])
    }
    this.gridLines = MeshBuilder.CreateLineSystem('grid', { lines, colors }, this.scene)
    this.gridLines.isPickable = false
  }

  #initLayers() {
    this.sketchNode = new TransformNode('sketch', this.scene)
    this.blockNode = new TransformNode('blocks', this.scene)
    this.draftLine = null
    this.markerRoot = new TransformNode('markers', this.scene)
    this.markerRoot.parent = this.sketchNode
    this.previewMesh = null
    this.handleMesh = null
    this.angleMesh = null
    this.axisLine = null
  }

  // ---------------------------------------------------------- 指针状态机
  #initPointer() {
    this.scene.onPointerObservable.add(pi => {
      const pt = () => ({ x: this.scene.pointerX, y: this.scene.pointerY })
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        this.downXY = pt()
        const hit = this.#pickMarker()
        if (hit?.metadata?.kind === 'depthHandle') { this.#beginDepthDrag(); return }
        if (hit?.metadata?.kind === 'angleHandle') { this.#beginAngleDrag(); return }
        if (state.mode === 'move' && hit?.metadata?.kind === 'block') {
          this.selectBlock(hit.metadata.id)
          this.#beginBlockDrag(hit.metadata.id)
          return
        }
      }
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        this.#onPointerMove()
        if (!this.dragging) this.#updateCursor()
      }
      if (pi.type === PointerEventTypes.POINTERUP) {
        if (this.dragging) { this.#endDrag(); return }
        const d = this.downXY, p = pt()
        this.downXY = null
        if (d && Math.hypot(p.x - d.x, p.y - d.y) > 8) return // 视为转视角
        this.#onTap()
      }
    })
  }

  #pickMarker() {
    // 地面用射线平面相交单独处理,这里只挑标记/积木,避免地面挡住拾取
    const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
      m => m.isPickable && m !== this.ground && m.metadata)
    return pick?.hit ? pick.pickedMesh : null
  }

  #groundPoint() {
    const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, null, this.cam)
    const t = ray.intersectsPlane(new Plane(0, 1, 0, 0))
    if (t === null || t < 0) return null
    const p = ray.origin.add(ray.direction.scale(t))
    return { x: p.x, z: p.z }
  }

  #updateCursor() {
    const hit = this.#pickMarker()
    const k = hit?.metadata?.kind
    this.canvas.style.cursor =
      k === 'depthHandle' || k === 'angleHandle' ? 'ns-resize'
      : k === 'block' ? 'move'
      : (k === 'candidate' || k === 'corner') ? 'pointer' : 'default'
  }

  #onTap() {
    const hit = this.#pickMarker()
    const k = hit?.metadata
    if (k?.kind === 'candidate') { this.finishDraft(); return }
    if (k?.kind === 'corner') { state.selectedCorner = k.index; this.syncCornerPanel(); return }
    if (state.mode === 'revolve' && this.axisArmed) { this.#axisTap(); return }

    const gp = this.#groundPoint()
    if (!gp) return
    if (state.mode === 'draw' && !state.shape) this.#tapDraw(gp)
  }

  #onPointerMove() {
    const gp = this.#groundPoint()
    if (!gp) return
    if (this.dragging === 'depth') { this.#dragDepth(gp); return }
    if (this.dragging === 'angle') { this.#dragAngle(); return }
    if (this.dragging === 'block') { this.#dragBlock(gp); return }

    // 起草预览
    if (state.mode === 'draw' && !state.shape && state.draft.points.length) {
      const prev = state.draft.points[state.draft.points.length - 1]
      const { point, constraint } = drawSnap(gp, prev)
      state.draft.preview = point
      state.draft.constraint = constraint
      this.labelsDirty = true
      this.#rebuildDraftLines()
    }
    if (this.axisArmed && state.axis) this.#updateAxisPreview(gp)
  }

  // ---------------------------------------------------------- 画线
  #tapDraw(gp) {
    const pts = state.draft.points
    // 端点吸附:靠近起点 → 闭合
    if (pts.length >= 2 && dist2(gp, pts[0]) <= SNAP_ENDPOINT) { this.finishDraft(); return }
    const prev = pts.length ? pts[pts.length - 1] : null
    const { point, constraint } = drawSnap(gp, prev)
    if (prev && dist2(point, prev) < 1e-6) return
    pts.push(point)
    state.draft.edgeConstraints.push(constraint)
    state.draft.preview = null
    this.#analyzeGap()
    this.#rebuildDraftLines()
    this.#rebuildMarkers()
    this.labelsDirty = true
  }

  addPointAtPreview() {
    if (!state.draft.preview) return
    this.#tapDraw(state.draft.preview)
  }

  undoPoint() {
    if (state.shape) return
    state.draft.points.pop()
    state.draft.edgeConstraints.pop()
    state.draft.preview = null
    this.#analyzeGap()
    this.#rebuildDraftLines()
    this.#rebuildMarkers()
  }

  clearDraft() {
    state.draft.points = []
    state.draft.edgeConstraints = []
    state.draft.preview = null
    state.draft.gap = null
    state.draft.candidates = []
    this.#rebuildDraftLines()
    this.#rebuildMarkers()
  }

  /** 缺口分析:红点 + 两个可补端点 */
  #analyzeGap() {
    const pts = state.draft.points
    if (pts.length < 2 || isClosed(pts)) { state.draft.gap = null; state.draft.candidates = []; return }
    const a = pts[0], b = pts[pts.length - 1]
    state.draft.gap = { mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2 }
    state.draft.candidates = [
      { x: b.x, z: b.z, role: 'end' },
      { x: a.x, z: a.z, role: 'start' },
    ]
  }

  closeGapWith() { this.finishDraft() }

  finishDraft() {
    const pts = state.draft.points
    if (pts.length < 3) { state.hint = '至少要画 3 个点才能围出形状哦~'; return }
    if (dist2(pts[0], pts[pts.length - 1]) <= SNAP_ENDPOINT) pts.pop()
    if (pts.length < 3) { state.hint = '形状太小啦,再画大一点!'; return }
    const closed = pts.map(p => ({ ...p }))
    // 先清空草稿,避免渲染帧读到 shape 与 draft 并存的中间态
    this.clearDraft()
    state.shape = { points: closed, corners: {}, dims: {} }
    state.selectedCorner = -1
    state.hint = '轮廓闭合成功!拖动手柄让它变厚,或转成回转体~'
    this.setMode('extrude')
  }

  // ---------------------------------------------------------- 模式
  setMode(mode) {
    if ((mode === 'extrude' || mode === 'revolve') && !state.shape) {
      state.hint = '先在网格上画一个封闭形状吧!'
      return
    }
    if (this.dragging) this.#endDrag()
    state.mode = mode
    this.axisArmed = false
    state.draft.preview = null
    const hints = {
      draw: state.shape ? '先把当前形状做成积木,或删掉重画~' : '在网格上点一下,开始画你的形状吧!',
      extrude: '拖动蓝色手柄,积木会实时变厚!',
      revolve: '先在画布上画一条旋转轴(点两下),再拖动手柄转起来~',
      move: '点住积木拖动,试试拼在一起吧!',
    }
    state.hint = hints[mode]
    this.#rebuildMarkers()
    this.#refreshPreview()
    this.labelsDirty = true
    // 画形状/拉伸/回转都要在画布平面上拾取:若相机被正视图压得太平,
    // 射线会与地面平行而无法落点,平滑回到一个能看清画布的斜俯视角
    if ((mode === 'draw' || mode === 'extrude' || mode === 'revolve') && this.cam.beta > 1.3) {
      this.#animateCameraTo({ beta: 0.95, alpha: -Math.PI / 2 })
    }
  }

  #animateCameraTo({ beta, alpha, radius }) {
    this.camAnim = {
      t0: performance.now(), dur: 450,
      fa: this.cam.alpha, fb: alpha ?? this.cam.alpha,
      fbeta: this.cam.beta, tbeta: beta,
      fr: this.cam.radius, tr: radius ?? this.cam.radius,
    }
  }

  // ---------------------------------------------------------- 草图线 / 标记
  #rebuildDraftLines() {
    const lines = [], colors = []
    const add = (a, b, c) => { lines.push([a, b]); colors.push([c, c]) }
    const blue = Color4.FromHexString('#3d7eccFF')
    const green = Color4.FromHexString('#2f9e58FF')
    const red = Color4.FromHexString('#e0463eFF')

    if (state.shape) {
      const loop = this.#shapeLoop()
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i], b = loop[(i + 1) % loop.length]
        add(new Vector3(a.x, 0.03, a.z), new Vector3(b.x, 0.03, b.z), green)
      }
    } else {
      const pts = state.draft.points
      pts.forEach((p, i) => {
        if (i === 0) return
        const q = pts[i - 1]
        add(new Vector3(q.x, 0.03, q.z), new Vector3(p.x, 0.03, p.z), blue)
      })
      const pv = state.draft.preview
      if (pv && pts.length) {
        const q = pts[pts.length - 1]
        add(new Vector3(q.x, 0.03, q.z), new Vector3(pv.x, 0.03, pv.z), Color4.FromHexString('#9dbbe6FF'))
      }
      if (state.draft.gap && pts.length >= 2) {
        const a = pts[0], b = pts[pts.length - 1]
        add(new Vector3(a.x, 0.04, a.z), new Vector3(b.x, 0.04, b.z), red)
      }
    }
    if (this.draftLine) this.draftLine.dispose()
    this.draftLine = lines.length
      ? MeshBuilder.CreateLineSystem('draftLines', { lines, colors, updatable: false }, this.scene)
      : null
    if (this.draftLine) { this.draftLine.parent = this.sketchNode; this.draftLine.isPickable = false }
  }

  #rebuildMarkers() {
    this.pickers = []
    this.sketchMeshes.forEach(m => m.dispose())
    this.sketchMeshes = []
    this.handleMesh = null
    this.angleMesh = null
    this.stemMesh = null
    this.axisLine = null
    this.axisParts = []
    const mk = (x, z, y, r, hex, kind, meta = {}) => {
      const s = MeshBuilder.CreateSphere(`m${this.pickers.length}`, { diameter: r * 2, segments: 14 }, this.scene)
      s.position = new Vector3(x, y, z)
      const m2 = new StandardMaterial(`mm${this.pickers.length}`, this.scene)
      m2.diffuseColor = Color3.FromHexString(hex)
      m2.emissiveColor = Color3.FromHexString(hex).scale(0.25)
      s.material = m2
      s.parent = this.markerRoot
      s.metadata = { kind, ...meta }
      s.isPickable = true
      this.pickers.push(s)
      this.sketchMeshes.push(s)
      return s
    }

    // 起草中的点
    if (!state.shape) {
      state.draft.points.forEach((p, i) => {
        const start = i === 0
        mk(p.x, p.z, 0.12, start ? 0.16 : 0.11, start ? '#2f9e58' : '#ffffff', start ? 'startPoint' : 'point')
      })
      if (state.draft.gap) {
        mk(state.draft.gap.mx, state.draft.gap.mz, 0.16, 0.13, '#e0463e', 'gapDot')
        state.draft.candidates.forEach(c =>
          mk(c.x, c.z, 0.14, 0.17, '#ffc531', 'candidate', { role: c.role }))
      }
      return
    }

    // 形状顶点:尖角 / 倒角 / 圆角标记
    if (state.mode !== 'move') {
      state.shape.points.forEach((p, i) => {
        const c = state.shape.corners[i]
        const selected = i === state.selectedCorner
        const hex = selected ? '#ff8a3d' : c?.type === 'fillet' ? '#7a5cff' : c?.type === 'chamfer' ? '#00a38c' : '#ffffff'
        mk(p.x, p.z, 0.11, selected ? 0.18 : 0.12, hex, 'corner', { index: i })
      })
      this.#buildAxisMeshes()
      this.#buildHandles()
    }
  }

  #buildAxisMeshes() {
    if (this.axisLine) { this.axisLine.dispose(); this.axisLine = null }
    this.axisParts?.forEach(m => m.dispose())
    this.axisParts = []
    if (state.mode !== 'revolve' || !state.axis) return
    const { ax, az, bx, bz } = state.axis
    const c = state.axisValid ? '#2f9e58' : '#e0463e'
    const col = Color4.FromHexString(c + 'FF')
    this.axisLine = MeshBuilder.CreateLineSystem('axis', {
      lines: [[new Vector3(ax, 0.05, az), new Vector3(bx, 0.05, bz)]], colors: [[col, col]],
    }, this.scene)
    this.axisLine.parent = this.sketchNode
    this.axisLine.isPickable = false
    this.sketchMeshes.push(this.axisLine)
    const mkEnd = (x, z) => {
      const s = MeshBuilder.CreateSphere('axE', { diameter: 0.3 }, this.scene)
      s.position = new Vector3(x, 0.15, z)
      const mat = new StandardMaterial('axM', this.scene)
      mat.diffuseColor = Color3.FromHexString(c)
      s.material = mat; s.parent = this.sketchNode; s.isPickable = false
      this.axisParts.push(s)
      this.sketchMeshes.push(s)
    }
    mkEnd(ax, az); mkEnd(bx, bz)
  }

  #buildHandles() {
    if (!state.shape) return
    const loop = this.#shapeLoop()
    const cx = loop.reduce((s, p) => s + p.x, 0) / loop.length
    const cz = loop.reduce((s, p) => s + p.z, 0) / loop.length

    if (state.mode === 'extrude') {
      const h = MeshBuilder.CreateSphere('depthHandle', { diameter: 0.55, segments: 18 }, this.scene)
      const mat = new StandardMaterial('hMat', this.scene)
      mat.diffuseColor = Color3.FromHexString('#3d7ecc')
      mat.emissiveColor = Color3.FromHexString('#3d7ecc').scale(0.35)
      h.material = mat
      h.position = new Vector3(cx, state.depth + 0.15, cz)
      h.metadata = { kind: 'depthHandle' }
      h.parent = this.sketchNode
      this.handleMesh = h
      this.sketchMeshes.push(h)
      const stem = MeshBuilder.CreateCylinder('stem', { height: Math.max(state.depth, 0.001), diameter: 0.08 }, this.scene)
      stem.position = new Vector3(cx, state.depth / 2, cz)
      const sm = new StandardMaterial('sm', this.scene); sm.diffuseColor = Color3.FromHexString('#3d7ecc')
      stem.material = sm; stem.parent = this.sketchNode; stem.isPickable = false
      this.stemMesh = stem
      this.sketchMeshes.push(stem)
    }

    if (state.mode === 'revolve') {
      const h = MeshBuilder.CreateSphere('angleHandle', { diameter: 0.55, segments: 18 }, this.scene)
      const mat = new StandardMaterial('aMat', this.scene)
      mat.diffuseColor = Color3.FromHexString('#a55ce0')
      mat.emissiveColor = Color3.FromHexString('#a55ce0').scale(0.35)
      h.material = mat
      h.position = new Vector3(cx, 2.4, cz)
      h.metadata = { kind: 'angleHandle' }
      h.parent = this.sketchNode
      this.angleMesh = h
      this.sketchMeshes.push(h)
    }
  }

  // ---------------------------------------------------------- 拉伸手柄
  #beginDepthDrag() {
    this.dragging = 'depth'
    this.dragStart = { depth: state.depth }
    this.cam.detachControl()
    state.hint = '上下拖动,看着积木一点点变厚~'
  }

  #dragDepth(gp) {
    if (!this.handleMesh) return
    const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, null, this.cam)
    const n = this.cam.getForwardRay().direction
    const plane = new Plane(n.x, n.y, n.z, -Vector3.Dot(n, this.handleMesh.position))
    const t = ray.intersectsPlane(plane)
    if (t === null) return
    const p = ray.origin.add(ray.direction.scale(t))
    const next = clamp(this.dragStart.depth + (p.y - this.handleMesh.position.y), 0.2, 6)
    this.setDepth(Math.round(next * 10) / 10)
  }

  setDepth(v) {
    state.depth = clamp(Number(v) || 0.2, 0.2, 6)
    if (this.handleMesh) {
      this.handleMesh.position.y = state.depth + 0.15
      if (this.stemMesh) {
        this.stemMesh.dispose()
        this.sketchMeshes = this.sketchMeshes.filter(m => m !== this.stemMesh)
        const loop = this.#shapeLoop()
        const cx = loop.reduce((s, p) => s + p.x, 0) / loop.length
        const cz = loop.reduce((s, p) => s + p.z, 0) / loop.length
        const stem = MeshBuilder.CreateCylinder('stem', { height: state.depth, diameter: 0.08 }, this.scene)
        stem.position = new Vector3(cx, state.depth / 2, cz)
        const sm = new StandardMaterial('sm', this.scene); sm.diffuseColor = Color3.FromHexString('#3d7ecc')
        stem.material = sm; stem.parent = this.sketchNode; stem.isPickable = false
        this.stemMesh = stem
        this.sketchMeshes.push(stem)
      }
    }
    this.#refreshPreview()
    this.labelsDirty = true
  }

  // ---------------------------------------------------------- 回转
  startAxisPick() {
    if (!state.shape) { state.hint = '先画一个封闭形状吧!'; return }
    this.setMode('revolve')
    this.axisArmed = true
    state.axis = null
    state.axisValid = false
    state.hint = '在画布上点第一下放转轴的起点,再点一下放终点~'
    this.#rebuildMarkers()
  }

  #axisTap() {
    const gp = this.#groundPoint()
    if (!gp) return
    const p = { x: snapGrid(gp.x), z: snapGrid(gp.z) }
    if (!state.axis) {
      state.axis = { ax: p.x, az: p.z, bx: p.x, bz: p.z }
      state.hint = '再点一下确定转轴的终点~'
    } else {
      state.axis.bx = p.x; state.axis.bz = p.z
      this.axisArmed = false
      this.#validateAxis()
    }
    this.#rebuildMarkers()
  }

  #updateAxisPreview(gp) {
    if (!state.axis) return
    state.axis.bx = snapGrid(gp.x)
    state.axis.bz = snapGrid(gp.z)
    this.#buildAxisMeshes()
    this.#validateAxis()
  }

  #validateAxis() {
    const { ax, az, bx, bz } = state.axis
    if (Math.hypot(bx - ax, bz - az) < 0.3) { state.axisValid = false; return }
    state.axisValid = profileOnOneSide(state.shape.points, { x: ax, z: az }, { x: bx, z: bz })
    state.hint = state.axisValid ? '转轴放好啦!拖紫色手柄转起来,15°一档~' : '转轴要放在轮廓的同一侧外面哦,换个位置试试~'
  }

  clearAxis() {
    state.axis = null
    state.axisValid = false
    this.axisArmed = false
    this.#rebuildMarkers()
    this.#refreshPreview()
  }

  #beginAngleDrag() {
    this.dragging = 'angle'
    this.dragStart = { y: this.scene.pointerY, angle: state.revAngle }
    this.cam.detachControl()
    state.hint = '上下拖动,每 15° 会“咔哒”吸住~'
  }

  #dragAngle() {
    const dy = this.dragStart.y - this.scene.pointerY
    const raw = clamp(this.dragStart.angle + dy * 1.6, 15, 360)
    const snapped = Math.round(raw / 15) * 15
    this.setRevAngle(snapped)
  }

  setRevAngle(v) {
    state.revAngle = clamp(Math.round(Number(v) / 15) * 15, 15, 360)
    this.#refreshPreview()
    this.labelsDirty = true
  }

  // ---------------------------------------------------------- 尖角:倒角 / 圆角
  selectCorner(i) { state.selectedCorner = i; this.syncCornerPanel() }

  syncCornerPanel() {
    const c = state.shape?.corners[state.selectedCorner]
    state.cornerMode = c?.type || 'none'
    state.cornerRadius = c?.r || 0.3
  }

  setCornerMode(type) {
    if (!state.shape) return
    state.cornerMode = type
    if (state.selectedCorner < 0 && !state.applyAll) {
      state.hint = type === 'none'
        ? '先点画布上的一个白色尖角吧~'
        : '再点画布上的尖角单独加工,或用下面的按钮一次全部加上~'
      return
    }
    this.#applyCorner()
  }

  setCornerRadius(r) {
    state.cornerRadius = clamp(Number(r), 0.05, 1.5)
    if (state.cornerMode !== 'none') this.#applyCorner()
  }

  applyCornerToAll() {
    if (!state.shape) return
    if (state.cornerMode === 'none') { state.shape.corners = {} }
    else for (let i = 0; i < state.shape.points.length; i++) {
      state.shape.corners[i] = { type: state.cornerMode, r: state.cornerRadius }
    }
    this.#afterCornerChange()
  }

  #applyCorner() {
    if (!state.shape) return
    const targets = state.applyAll ? state.shape.points.map((_, i) => i) : [state.selectedCorner]
    for (const i of targets) {
      if (i < 0) continue
      if (state.cornerMode === 'none') delete state.shape.corners[i]
      else state.shape.corners[i] = { type: state.cornerMode, r: state.cornerRadius }
    }
    this.#afterCornerChange()
  }

  #afterCornerChange() {
    this.#rebuildDraftLines()
    this.#rebuildMarkers()
    this.#refreshPreview()
    this.labelsDirty = true
  }

  // ---------------------------------------------------------- 轮廓 / 预览体
  #shapeLoop() {
    if (!state.shape) return []
    return sampleContour(buildElements(state.shape.points, state.shape.corners))
  }

  #refreshPreview() {
    if (this.previewMesh) { this.previewMesh.dispose(); this.previewMesh = null }
    if (!state.shape || state.mode === 'move' || state.mode === 'draw') { return }
    const loop = this.#shapeLoop()
    let geo
    if (state.mode === 'extrude') geo = buildExtrude(loop, state.depth)
    else {
      if (!state.axis || !state.axisValid) return
      geo = buildRevolve(loop,
        { x: state.axis.ax, z: state.axis.az },
        { x: state.axis.bx, z: state.axis.bz }, state.revAngle)
    }
    const m = this.#meshFromGeo('preview', geo, '#9cc4f2', 0.55)
    m.parent = this.sketchNode
    this.previewMesh = m
  }

  #meshFromGeo(name, geo, hex, alpha = 1) {
    const m = new Mesh(name, this.scene)
    const normals = []
    VertexData.ComputeNormals(geo.positions, geo.indices, normals)
    const vd = new VertexData()
    vd.positions = geo.positions
    vd.indices = geo.indices
    vd.normals = normals
    vd.applyToMesh(m)
    const mat = new StandardMaterial(name + 'Mat', this.scene)
    mat.diffuseColor = Color3.FromHexString(hex)
    mat.specularColor = new Color3(0.25, 0.25, 0.25)
    mat.backFaceCulling = false
    mat.alpha = alpha
    if (alpha < 1) mat.emissiveColor = Color3.FromHexString(hex).scale(0.15)
    m.material = mat
    return m
  }

  // ---------------------------------------------------------- 积木
  buildExtrude() {
    if (!state.shape) { state.hint = '先画一个封闭形状吧!'; return }
    const loop = this.#shapeLoop()
    const geo = buildExtrude(loop, state.depth)
    this.#createBlock('extrude', geo)
  }

  buildRevolve() {
    if (!state.shape) { state.hint = '先画一个封闭形状吧!'; return }
    if (!state.axisValid) { state.hint = '先画一条位于轮廓外侧的转轴哦~'; return }
    const loop = this.#shapeLoop()
    const geo = buildRevolve(loop,
      { x: state.axis.ax, z: state.axis.az },
      { x: state.axis.bx, z: state.axis.bz }, state.revAngle)
    this.#createBlock('revolve', geo)
  }

  #createBlock(kind, geo) {
    const id = `b${++this.blockSeq}`
    const color = BLOCK_COLORS[(this.blockSeq - 1) % BLOCK_COLORS.length]
    const m = this.#meshFromGeo(id, geo, color.diffuse)
    m.parent = this.blockNode
    m.metadata = { kind: 'block', id }
    m.isPickable = true
    this.shadow?.addShadowCaster(m)
    const block = {
      id,
      name: `${kind === 'extrude' ? '拉伸' : '回转'}积木 ${this.blockSeq}`,
      kind,
      color,
      x: 0, z: 0,
      points: state.shape.points.map(p => ({ ...p })),
      corners: JSON.parse(JSON.stringify(state.shape.corners)),
      depth: state.depth,
      axis: state.axis ? { ...state.axis } : null,
      revAngle: state.revAngle,
      mesh: m,
    }
    m.position = new Vector3(0, 0, 0)
    state.blocks.push(block)
    state.blockCount = state.blocks.length
    this.selectBlock(id)
    // 清掉工作草图,准备画下一个
    state.shape = null
    state.axis = null
    state.axisValid = false
    state.selectedCorner = -1
    this.clearDraft()
    this.setMode('move')
    state.hint = '积木做好啦!拖住它移动,和别的积木拼拼看~'
    this.#scheduleCollision()
  }

  selectBlock(id) {
    state.selectedId = id
    for (const b of state.blocks) {
      const sel = b.id === id
      b.mesh.renderOutline = sel && !state.collisions.includes(id)
      b.mesh.outlineWidth = 0.04
      b.mesh.outlineColor = Color3.FromHexString('#ff8a3d')
    }
    this.labelsDirty = true
  }

  #beginBlockDrag(id) {
    const b = state.blocks.find(x => x.id === id)
    const gp = this.#groundPoint()
    if (!b || !gp) return
    this.dragging = 'block'
    this.dragBlock = { id, offX: b.x - gp.x, offZ: b.z - gp.z }
    this.cam.detachControl()
  }

  #dragBlock(gp) {
    const b = state.blocks.find(x => x.id === this.dragBlock.id)
    if (!b) return
    b.x = snapGrid(gp.x + this.dragBlock.offX, GRID / 2)
    b.z = snapGrid(gp.z + this.dragBlock.offZ, GRID / 2)
    b.mesh.position.x = b.x
    b.mesh.position.z = b.z
    this.#scheduleCollision()
    this.labelsDirty = true
  }

  #endDrag() {
    this.dragging = null
    this.dragBlock = null
    // 延迟一个事件循环再交还相机,避免本次松手被 ArcRotateCamera 当成一次甩动
    setTimeout(() => this.cam.attachControl(this.canvas, true), 0)
    this.#runCollision()
  }

  duplicateSelected() {
    const src = state.blocks.find(b => b.id === state.selectedId)
    if (!src) { state.hint = '先选中一块积木再复制哦~'; return }
    const id = `b${++this.blockSeq}`
    const color = BLOCK_COLORS[(this.blockSeq - 1) % BLOCK_COLORS.length]
    const copy = {
      ...src,
      id,
      name: `积木副本 ${this.blockSeq}`,
      color,
      corners: JSON.parse(JSON.stringify(src.corners)),
      points: src.points.map(p => ({ ...p })),
      axis: src.axis ? { ...src.axis } : null,
      mesh: null,
    }
    const loop = sampleContour(buildElements(copy.points, copy.corners))
    const geo = copy.kind === 'extrude'
      ? buildExtrude(loop, copy.depth)
      : buildRevolve(loop, { x: copy.axis.ax, z: copy.axis.az }, { x: copy.axis.bx, z: copy.axis.bz }, copy.revAngle)
    const m = this.#meshFromGeo(id, geo, color.diffuse)
    m.parent = this.blockNode
    m.metadata = { kind: 'block', id }
    m.isPickable = true
    this.shadow?.addShadowCaster(m)
    // 放在旁边
    const maxX = Math.max(...loop.map(p => p.x)) - Math.min(...loop.map(p => p.x))
    copy.x = src.x + maxX + 1.2
    copy.z = src.z
    m.position = new Vector3(copy.x, 0, copy.z)
    copy.mesh = m
    state.blocks.push(copy)
    state.blockCount = state.blocks.length
    this.selectBlock(id)
    state.hint = '复制好啦,拖到旁边拼拼看!'
    this.#scheduleCollision()
  }

  deleteSelected() {
    const i = state.blocks.findIndex(b => b.id === state.selectedId)
    if (i < 0) return
    const [b] = state.blocks.splice(i, 1)
    this.shadow?.removeShadowCaster(b.mesh)
    b.mesh.dispose()
    state.selectedId = null
    state.blockCount = state.blocks.length
    state.collisions = []
    this.labelsDirty = true
    this.#scheduleCollision()
  }

  // ---------------------------------------------------------- 穿模检测(CSG)
  #scheduleCollision() {
    clearTimeout(this.collisionTimer)
    this.collisionTimer = setTimeout(() => this.runCollision(), 160)
  }

  /** 立即执行一次穿模检测(拖动结束/外部调试用) */
  runCollision() { this.#runCollision() }

  #runCollision() {
    const hit = new Set()
    const bs = state.blocks
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j]
        // 包围盒快速排除
        if (!this.#bvhOverlap(a, b)) continue
        try {
          const csgA = CSG.FromMesh(a.mesh)
          const csgB = CSG.FromMesh(b.mesh)
          const tmp = csgA.intersect(csgB).toMesh('csgTmp', new StandardMaterial('csg', this.scene), this.scene)
          const overlap = tmp.getTotalVertices() > 0
          tmp.dispose()
          if (overlap) { hit.add(a.id); hit.add(b.id) }
        } catch (e) { /* 单个检测失败不影响整体 */ }
      }
    }
    state.collisions = [...hit]
    for (const b of bs) {
      if (hit.has(b.id)) {
        b.mesh.renderOutline = true
        b.mesh.outlineColor = Color3.Red()
        b.mesh.outlineWidth = 0.05
      } else {
        const sel = b.id === state.selectedId
        b.mesh.renderOutline = sel
        b.mesh.outlineColor = Color3.FromHexString('#ff8a3d')
        b.mesh.outlineWidth = 0.04
      }
    }
    if (hit.size) state.hint = '哎呀,红色轮廓的地方撞在一起啦,拖开一点试试~'
    this.labelsDirty = true
  }

  #bvhOverlap(a, b) {
    const ba = a.mesh.getHierarchyBoundingVectors(true)
    const bb = b.mesh.getHierarchyBoundingVectors(true)
    return ba.min.x <= bb.max.x && ba.max.x >= bb.min.x &&
      ba.min.y <= bb.max.y && ba.max.y >= bb.min.y &&
      ba.min.z <= bb.max.z && ba.max.z >= bb.min.z
  }

  // ---------------------------------------------------------- 尺寸双击编辑
  editDimension(edgeIndex, value) {
    const len = parseFloat(value)
    if (!isFinite(len) || len <= 0) { state.hint = '要输入一个大于 0 的数字哦~'; return }
    // 优先编辑选中的积木,否则编辑工作草图
    const block = state.blocks.find(b => b.id === state.selectedId)
    if (block && state.mode === 'move') {
      block.points = resizeEdge(block.points, edgeIndex, len)
      this.#rebuildBlockMesh(block)
      state.hint = '尺寸改好啦,积木的大小已经跟着变了~'
      return
    }
    if (state.shape) {
      state.shape.points = resizeEdge(state.shape.points, edgeIndex, len)
      this.#afterCornerChange()
      state.hint = '尺寸改好啦,轮廓的宽度高度已经重算~'
    }
  }

  #rebuildBlockMesh(block) {
    const loop = sampleContour(buildElements(block.points, block.corners))
    const geo = block.kind === 'extrude'
      ? buildExtrude(loop, block.depth)
      : buildRevolve(loop, { x: block.axis.ax, z: block.axis.az }, { x: block.axis.bx, z: block.axis.bz }, block.revAngle)
    const pos = block.mesh.position.clone()
    this.shadow?.removeShadowCaster(block.mesh)
    block.mesh.dispose()
    const m = this.#meshFromGeo(block.id, geo, block.color.diffuse)
    m.parent = this.blockNode
    m.position = pos
    m.metadata = { kind: 'block', id: block.id }
    m.isPickable = true
    this.shadow?.addShadowCaster(m)
    block.mesh = m
    this.#scheduleCollision()
  }

  // ---------------------------------------------------------- HTML 标签投影
  #currentContour() {
    if (state.mode === 'move') {
      const b = state.blocks.find(x => x.id === state.selectedId)
      if (b) return b.points
    }
    return state.shape?.points || null
  }

  #buildLabelData() {
    const out = []
    // 水平/垂直约束标记
    if (!state.shape && state.draft.points.length) {
      const pts = state.draft.points
      state.draft.edgeConstraints.forEach((c, i) => {
        if (!c) return
        const a = pts[i], b = pts[i + 1]
        if (!a || !b) return
        out.push({
          kind: 'constraint', text: c === 'h' ? '—' : '│',
          world: new Vector3((a.x + b.x) / 2, 0.25, (a.z + b.z) / 2),
        })
      })
      if (state.draft.constraint && state.draft.preview && pts.length) {
        const a = pts[pts.length - 1], b = state.draft.preview
        out.push({
          kind: 'constraint', text: state.draft.constraint === 'h' ? '—' : '│',
          world: new Vector3((a.x + b.x) / 2, 0.25, (a.z + b.z) / 2),
        })
      }
    }
    // 尺寸标签
    let contour = this.#currentContour()
    let offX = 0, offZ = 0
    if (state.mode === 'move') {
      const b = state.blocks.find(x => x.id === state.selectedId)
      if (b) { offX = b.x; offZ = b.z }
    }
    if (contour && contour.length >= 2) {
      for (let i = 0; i < contour.length; i++) {
        const a = contour[i], b = contour[(i + 1) % contour.length]
        const len = dist2(a, b)
        if (len < 0.15) continue
        out.push({
          kind: 'dim', text: len.toFixed(1), edgeIndex: i,
          world: new Vector3((a.x + b.x) / 2 + offX, 0.08, (a.z + b.z) / 2 + offZ),
        })
      }
    }
    // 手柄读数
    if (this.handleMesh) {
      out.push({ kind: 'readout', text: `厚 ${state.depth.toFixed(1)}`, world: this.handleMesh.position.add(new Vector3(0.5, 0.25, 0)) })
    }
    if (this.angleMesh) {
      out.push({ kind: 'readout', text: `${state.revAngle}°`, world: this.angleMesh.position.add(new Vector3(0.5, 0.25, 0)) })
    }
    return out
  }

  #syncLabels() {
    const sig = `${this.cam.alpha.toFixed(3)}|${this.cam.beta.toFixed(3)}|${this.cam.radius.toFixed(2)}|${this.cam.target.x.toFixed(1)}|${this.cam.target.z.toFixed(1)}`
    if (!this.labelsDirty && sig === this.camSig) return
    this.camSig = sig
    this.labelsDirty = false
    const data = this.#buildLabelData()
    const vw = this.engine.getRenderWidth(), vh = this.engine.getRenderHeight()
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const viewport = new Viewport(0, 0, vw, vh)
    const labels = []
    for (const d of data) {
      const p = Vector3.Project(d.world, Matrix.Identity(), this.scene.getTransformMatrix(), viewport)
      if (p.z > 1 || p.z < -1) continue
      labels.push({
        id: labels.length,
        kind: d.kind,
        text: d.text,
        edgeIndex: d.edgeIndex,
        x: p.x * (cw / vw),
        y: (vh - p.y) * (ch / vh),
      })
    }
    state.labels = labels
  }

  // ---------------------------------------------------------- 视角
  focusView(kind) {
    if (kind === 'top') {
      this.#animateCameraTo({ beta: 0.06, alpha: -Math.PI / 2, radius: Math.max(this.cam.radius, 16) })
      state.hint = '俯视图来啦,整张画布看得清清楚楚~'
    } else {
      this.#animateCameraTo({ beta: Math.PI / 2 - 0.06, alpha: -Math.PI / 2 })
      state.hint = '正视图来啦,看看积木的正面~'
    }
  }

  #tickCameraAnim() {
    if (!this.camAnim) return
    const a = this.camAnim
    const k = clamp((performance.now() - a.t0) / a.dur, 0, 1)
    const e = 1 - Math.pow(1 - k, 3)
    this.cam.alpha = a.fa + (a.fb - a.fa) * e
    this.cam.beta = a.fbeta + (a.tbeta - a.fbeta) * e
    this.cam.radius = a.fr + (a.tr - a.fr) * e
    if (k >= 1) this.camAnim = null
  }

  // ---------------------------------------------------------- 导出图片
  exportImage() {
    if (!state.blocks.length) { state.hint = '还没有积木呢,先做一块再留念吧~'; return }
    state.exporting = true
    this.sketchNode.setEnabled(false)
    setTimeout(() => {
      Tools.CreateScreenshot(this.engine, this.cam, { width: 1600, height: 1200 }, dataURL => {
        const a = document.createElement('a')
        a.href = dataURL
        a.download = `我的积木作品-${new Date().toISOString().slice(0, 10)}.png`
        a.click()
        this.sketchNode.setEnabled(true)
        state.exporting = false
        state.hint = '照片保存好啦,快去看看吧!📸'
      })
    }, 120)
  }

  #onResize = () => this.engine.resize()

  /** 只读观察口,供调试/测试读取响应式状态 */
  getState() { return state }

  /** 世界坐标 → canvas CSS 像素坐标(供测试与外部覆盖层使用) */
  projectToScreen(world) {
    const vw = this.engine.getRenderWidth(), vh = this.engine.getRenderHeight()
    const p = Vector3.Project(world, Matrix.Identity(), this.scene.getTransformMatrix(), new Viewport(0, 0, vw, vh))
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    return { x: p.x * (cw / vw), y: (vh - p.y) * (ch / vh), visible: p.z >= -1 && p.z <= 1 }
  }

  dispose() {
    window.removeEventListener('resize', this.#onResize)
    this.engine.stopRenderLoop()
    this.scene.dispose()
    this.engine.dispose()
  }
}

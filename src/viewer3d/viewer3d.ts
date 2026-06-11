import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Store } from '../core/store';
import type { Wall } from '../core/types';
import { wallLen } from '../core/geometry';
import { floorOf } from '../core/catalog';
import { floorTexture, skyTexture } from './textures';
import { buildItem } from './furniture3d';

/**
 * 坐标映射：平面 (x, y) -> 三维 (x, 0, -y)，单位 cm。
 */
export class Viewer3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private sun: THREE.DirectionalLight;

  private buildGroup = new THREE.Group();
  private itemsGroup = new THREE.Group();
  private selHelper: THREE.BoxHelper | null = null;

  private visible = false;
  private dirty = true;
  private fitPending = true;

  // 家具拖拽
  private raycaster = new THREE.Raycaster();
  private downPos = { x: 0, y: 0 };
  private dragItem: { id: string; offX: number; offZ: number; moved: boolean } | null = null;

  // 漫游
  private walk = {
    on: false, yaw: 0, pitch: 0,
    keys: new Set<string>(),
    saved: null as null | { pos: THREE.Vector3; target: THREE.Vector3 },
  };
  private lastT = performance.now();

  private matCache = new Map<string, THREE.MeshStandardMaterial>();

  constructor(private canvas: HTMLCanvasElement, private store: Store) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xe3ebf3, 8000, 28000);

    this.camera = new THREE.PerspectiveCamera(52, 1, 10, 60000);
    this.camera.position.set(900, 900, 1200);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = 1.52;
    this.controls.minDistance = 60;
    this.controls.maxDistance = 22000;

    // 环境光照
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    (this.scene as unknown as { environmentIntensity?: number }).environmentIntensity = 0.38;

    this.scene.add(new THREE.HemisphereLight(0xe9f2ff, 0xb3a88f, 0.85));

    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 3;
    this.scene.add(this.sun, this.sun.target);

    // 地面
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(30000, 64),
      new THREE.MeshStandardMaterial({ color: 0xc9d1c6, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.scene.add(this.buildGroup, this.itemsGroup);

    // 事件
    store.on('change', () => { this.dirty = true; });
    store.on('project', () => { this.dirty = true; this.fitPending = true; });
    store.on('sel', () => this.syncSelection());

    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);

    new ResizeObserver(() => this.resize()).observe(canvas);

    this.loop();
  }

  // ---------------- 可见性 / 尺寸 ----------------
  setVisible(v: boolean) {
    this.visible = v;
    if (v) {
      this.resize();
      if (this.dirty) this.rebuild();
      if (this.fitPending) this.fitCamera();
    } else if (this.walk.on) {
      this.toggleWalk();
    }
  }

  private resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------- 材质 ----------------
  private cachedMat(key: string, make: () => THREE.MeshStandardMaterial) {
    let m = this.matCache.get(key);
    if (!m) { m = make(); this.matCache.set(key, m); }
    return m;
  }

  private wallMat() {
    const color = this.store.project.settings.wallColor;
    return this.cachedMat(`wall|${color}`, () =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.94 }));
  }

  private floorMat(floorId?: string) {
    const f = floorOf(floorId);
    const rough = f.kind === 'wood' ? 0.6 : f.kind === 'tile' ? 0.35 : f.kind === 'marble' ? 0.28 : 1;
    return this.cachedMat(`floor|${f.id}`, () =>
      new THREE.MeshStandardMaterial({ map: floorTexture(f.kind, f.base), roughness: rough }));
  }

  // ---------------- 场景重建 ----------------
  private disposeGroup(g: THREE.Group) {
    g.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) mesh.geometry.dispose();
    });
    g.clear();
  }

  rebuild() {
    this.dirty = false;
    this.disposeGroup(this.buildGroup);
    this.disposeGroup(this.itemsGroup);

    const p = this.store.project;
    for (const wall of p.walls) {
      if (wallLen(wall) < 4) continue;
      this.buildGroup.add(this.buildWall(wall));
    }

    // 地板与天花板
    for (let i = 0; i < this.store.rooms.length; i++) {
      const room = this.store.rooms[i];
      const meta = room.metaId ? this.store.meta(room.metaId) : undefined;
      const shape = new THREE.Shape(room.poly.map(pt => new THREE.Vector2(pt.x, pt.y)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const floor = new THREE.Mesh(geo, this.floorMat(meta?.floor));
      floor.receiveShadow = true;
      floor.userData.roomIdx = i;
      this.buildGroup.add(floor);

      if (p.settings.showCeiling) {
        const cgeo = geo.clone();
        const ceil = new THREE.Mesh(cgeo, this.cachedMat('ceiling', () =>
          new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.95, side: THREE.DoubleSide })));
        ceil.position.y = p.settings.wallHeight;
        this.buildGroup.add(ceil);
      }
    }

    for (const item of p.items) this.itemsGroup.add(buildItem(item));

    // 光照范围适配场景
    const { center, radius } = this.sceneBounds();
    this.sun.position.set(center.x + radius * 0.7, radius * 1.4 + 600, center.z + radius * 0.9);
    this.sun.target.position.copy(center);
    const sc = this.sun.shadow.camera;
    const ext = radius + 300;
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
    sc.near = 100; sc.far = radius * 4 + 3000;
    sc.updateProjectionMatrix();

    this.syncSelection();
  }

  private sceneBounds() {
    const p = this.store.project;
    if (!p.walls.length && !p.items.length) {
      return { center: new THREE.Vector3(0, 0, 0), radius: 800 };
    }
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    const acc = (x: number, z: number) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    };
    for (const w of p.walls) { acc(w.ax, -w.ay); acc(w.bx, -w.by); }
    for (const it of p.items) acc(it.x, -it.y);
    const center = new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const radius = Math.max(maxX - minX, maxZ - minZ, 400) / 2 + 200;
    return { center, radius };
  }

  /** 墙体网格：底边带门洞缺口、窗洞为孔，再沿厚度方向挤出 */
  private buildWall(wall: Wall): THREE.Group {
    const g = new THREE.Group();
    const L = wallLen(wall);
    const H = wall.height, T = wall.thickness;

    const ops = this.store.project.openings
      .filter(o => o.wallId === wall.id && o.width < L - 8)
      .map(o => {
        const half = o.width / 2;
        const cx = Math.max(half + 3, Math.min(L - half - 3, o.t * L));
        const top = Math.min(o.sill + o.height, H - 8);
        return { ...o, cx, x1: cx - half, x2: cx + half, top };
      });
    const doors = ops.filter(o => o.kind === 'door').sort((a, b) => a.cx - b.cx);
    const windows = ops.filter(o => o.kind === 'window');

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (const d of doors) {
      shape.lineTo(d.x1, 0);
      shape.lineTo(d.x1, d.top);
      shape.lineTo(d.x2, d.top);
      shape.lineTo(d.x2, 0);
    }
    shape.lineTo(L, 0);
    shape.lineTo(L, H);
    shape.lineTo(0, H);
    shape.closePath();

    for (const w of windows) {
      const sill = Math.min(w.sill, H - w.height - 8);
      const hole = new THREE.Path();
      hole.moveTo(w.x1, sill);
      hole.lineTo(w.x2, sill);
      hole.lineTo(w.x2, w.top);
      hole.lineTo(w.x1, w.top);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    geo.translate(0, 0, -T / 2);
    const mesh = new THREE.Mesh(geo, this.wallMat());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.wallId = wall.id;
    g.add(mesh);

    // 门窗构件
    const frameMat = this.cachedMat('frame', () => new THREE.MeshStandardMaterial({ color: 0xe9e5dd, roughness: 0.5 }));
    const panelMat = this.cachedMat('panel', () => new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.55 }));
    const glassMat = this.cachedMat('glass', () => {
      const m = new THREE.MeshStandardMaterial({ color: 0xbcd8e8, roughness: 0.08, metalness: 0.1 });
      m.transparent = true;
      m.opacity = 0.32;
      return m;
    });
    const handleMat = this.cachedMat('handle', () => new THREE.MeshStandardMaterial({ color: 0xc4cad1, roughness: 0.3, metalness: 0.85 }));

    const addBox = (m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, shadow = true) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z);
      b.castShadow = shadow;
      b.receiveShadow = true;
      b.userData.wallId = wall.id;
      g.add(b);
      return b;
    };

    for (const d of doors) {
      const h = d.top;
      addBox(frameMat, 6, h, T + 2, d.x1 + 3, h / 2, 0);
      addBox(frameMat, 6, h, T + 2, d.x2 - 3, h / 2, 0);
      addBox(frameMat, d.width, 6, T + 2, d.cx, h - 3, 0);
      addBox(panelMat, d.width - 8, h - 6, 4.5, d.cx, (h - 6) / 2, 0);
      for (const s of [-1, 1]) {
        addBox(handleMat, 9, 2.4, 2.4, d.cx + d.width / 2 - 14, 96, s * 3.4, false);
      }
    }

    for (const w of windows) {
      const sill = Math.min(w.sill, H - w.height - 8);
      const wh = w.top - sill;
      if (wh <= 8) continue;
      addBox(frameMat, w.width, 5, T + 1.5, w.cx, sill + 2.5, 0);
      addBox(frameMat, w.width, 5, T + 1.5, w.cx, sill + wh - 2.5, 0);
      addBox(frameMat, 5, wh, T + 1.5, w.x1 + 2.5, sill + wh / 2, 0);
      addBox(frameMat, 5, wh, T + 1.5, w.x2 - 2.5, sill + wh / 2, 0);
      addBox(glassMat, w.width - 8, wh - 8, 1, w.cx, sill + wh / 2, 0, false);
      if (w.width >= 130) addBox(frameMat, 4, wh - 8, 3, w.cx, sill + wh / 2, 0);
    }

    g.position.set(wall.ax, 0, -wall.ay);
    g.rotation.y = Math.atan2(wall.by - wall.ay, wall.bx - wall.ax);
    return g;
  }

  // ---------------- 相机 ----------------
  fitCamera() {
    this.fitPending = false;
    const { center, radius } = this.sceneBounds();
    this.camera.position.set(center.x + radius * 0.6, radius * 1.15 + 250, center.z + radius * 1.25);
    this.controls.target.set(center.x, 40, center.z);
    this.controls.update();
  }

  // ---------------- 选择与拖拽 ----------------
  private ndc(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  private pickItem(e: PointerEvent): string | null {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const hit = this.raycaster.intersectObjects(this.itemsGroup.children, true)[0];
    return hit ? (hit.object.userData.itemId as string) ?? null : null;
  }

  private floorPoint(e: PointerEvent): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const out = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, out) ? out : null;
  }

  private onDown = (e: PointerEvent) => {
    if (!this.visible || this.walk.on || e.button !== 0) return;
    this.downPos = { x: e.clientX, y: e.clientY };
    const itemId = this.pickItem(e);
    if (itemId) {
      const it = this.store.item(itemId);
      const fp = this.floorPoint(e);
      if (it && fp) {
        this.controls.enabled = false;
        this.dragItem = { id: itemId, offX: it.x - fp.x, offZ: -it.y - fp.z, moved: false };
        this.store.setSel({ kind: 'item', id: itemId });
      }
    }
  };

  private onMove = (e: PointerEvent) => {
    if (!this.visible) return;
    if (this.walk.on) {
      if (e.buttons) {
        this.walk.yaw -= e.movementX * 0.0042;
        this.walk.pitch = Math.max(-1.35, Math.min(1.35, this.walk.pitch - e.movementY * 0.0042));
      }
      return;
    }
    if (this.dragItem) {
      const fp = this.floorPoint(e);
      if (!fp) return;
      const d = this.dragItem;
      if (!d.moved) {
        if (Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) < 4) return;
        d.moved = true;
        this.store.begin();
      }
      const x = Math.round(fp.x + d.offX);
      const y = Math.round(-(fp.z + d.offZ));
      this.store.update(p => {
        const it = p.items.find(i => i.id === d.id);
        if (it) { it.x = x; it.y = y; }
      });
    }
  };

  private onUp = (e: PointerEvent) => {
    if (!this.visible) return;
    if (this.dragItem) {
      const d = this.dragItem;
      this.dragItem = null;
      this.controls.enabled = true;
      if (d.moved) this.store.end(true);
      return;
    }
    if (this.walk.on) return;
    // 单击（非拖拽）：选中墙 / 房间 / 取消选择
    if (Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) > 5 || e.button !== 0) return;
    if ((e.target as HTMLElement) !== this.canvas) return;
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const hit = this.raycaster.intersectObjects(this.buildGroup.children, true)[0];
    if (!hit) { this.store.setSel(null); return; }
    const wallId = hit.object.userData.wallId as string | undefined;
    const roomIdx = hit.object.userData.roomIdx as number | undefined;
    if (wallId) this.store.setSel({ kind: 'wall', id: wallId });
    else if (roomIdx !== undefined && this.store.rooms[roomIdx]) this.store.selectRoom(this.store.rooms[roomIdx]);
    else this.store.setSel(null);
  };

  private syncSelection() {
    if (this.selHelper) {
      this.scene.remove(this.selHelper);
      this.selHelper.dispose();
      this.selHelper = null;
    }
    const s = this.store.sel;
    if (!s) return;
    let target: THREE.Object3D | undefined;
    if (s.kind === 'item') {
      target = this.itemsGroup.children.find(c => c.userData.itemId === s.id);
    } else if (s.kind === 'wall') {
      target = this.buildGroup.children.find(c => c.children[0]?.userData.wallId === s.id);
    }
    if (target) {
      this.selHelper = new THREE.BoxHelper(target, 0x3b7dff);
      this.scene.add(this.selHelper);
    }
  }

  // ---------------- 漫游 ----------------
  toggleWalk() {
    if (!this.walk.on) {
      this.walk.saved = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const rooms = this.store.rooms;
      const c = rooms.length
        ? new THREE.Vector3(rooms[0].centroid.x, 160, -rooms[0].centroid.y)
        : this.sceneBounds().center.clone().setY(160);
      this.camera.position.copy(c);
      this.camera.rotation.order = 'YXZ';
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.walk.yaw = Math.atan2(-dir.x, -dir.z);
      this.walk.pitch = 0;
      this.controls.enabled = false;
      this.walk.on = true;
      this.store.setWalking(true);
    } else {
      this.walk.on = false;
      if (this.walk.saved) {
        this.camera.position.copy(this.walk.saved.pos);
        this.controls.target.copy(this.walk.saved.target);
      }
      this.controls.enabled = true;
      this.controls.update();
      this.store.setWalking(false);
    }
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.walk.on) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (e.type === 'keydown') this.walk.keys.add(k);
      else this.walk.keys.delete(k);
      e.preventDefault();
    }
  };

  private stepWalk(dt: number) {
    const w = this.walk;
    this.camera.rotation.set(w.pitch, w.yaw, 0, 'YXZ');
    const speed = (w.keys.has('shift') ? 700 : 320) * dt;
    const fwd = new THREE.Vector3(-Math.sin(w.yaw), 0, -Math.cos(w.yaw));
    const right = new THREE.Vector3(Math.cos(w.yaw), 0, -Math.sin(w.yaw));
    const mv = new THREE.Vector3();
    if (w.keys.has('w') || w.keys.has('arrowup')) mv.add(fwd);
    if (w.keys.has('s') || w.keys.has('arrowdown')) mv.sub(fwd);
    if (w.keys.has('d') || w.keys.has('arrowright')) mv.add(right);
    if (w.keys.has('a') || w.keys.has('arrowleft')) mv.sub(right);
    if (mv.lengthSq() > 0) {
      mv.normalize().multiplyScalar(speed);
      this.camera.position.add(mv);
    }
    this.camera.position.y = 160;
  }

  // ---------------- 主循环 ----------------
  private loop = () => {
    requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;
    if (!this.visible) return;
    if (this.dirty) this.rebuild();
    if (this.walk.on) this.stepWalk(dt);
    else this.controls.update();
    if (this.selHelper) this.selHelper.update();
    this.renderer.render(this.scene, this.camera);
  };

  screenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
}

import * as THREE from 'three';
import type { Store } from '../core/store/store';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene, layoutSun } from './scene-env';
import { buildWall } from './build-walls';
import type { DoorRef } from './build-openings';
import { buildFloors } from './build-floors';
import { buildItem } from './furniture/build-item';
import { bindInteract } from './interact';
import { disposeGroup, sceneBounds } from './util3d';
import type { Bounds } from './util3d';
import { wallLen } from '../core/geometry/vec';
import { Walk } from './walk';

export class Viewer3D {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  sun: THREE.DirectionalLight;
  buildGroup = new THREE.Group();
  itemGroup = new THREE.Group();
  doors: DoorRef[] = [];
  walk: Walk;
  visible = false;
  private dirty = true;
  private raf = 0;
  private clock = new THREE.Clock();
  private unsubs: (() => void)[] = [];
  private ro: ResizeObserver;

  constructor(public canvas: HTMLCanvasElement, public store: Store) {
    const kit = initScene(canvas);
    this.renderer = kit.renderer;
    this.scene = kit.scene;
    this.camera = kit.camera;
    this.controls = kit.controls;
    this.sun = kit.sun;
    this.scene.add(this.buildGroup, this.itemGroup);
    this.walk = new Walk(this);
    this.unsubs.push(
      this.store.on('change', () => { this.dirty = true; }),
      this.store.on('project', () => { this.dirty = true; this.fitCamera(); }),
      bindInteract(this),
    );
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.fitCamera();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      if (!this.visible) return;
      if (this.dirty) { this.rebuild(); this.dirty = false; }
      this.walk.step(dt);
      if (this.controls.enabled) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.unsubs.forEach((u) => u());
    this.ro.disconnect();
    this.renderer.dispose();
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) { this.resize(); this.dirty = true; }
    else if (this.walk.active) this.walk.exit();
  }

  resize() {
    const host = this.canvas.parentElement ?? this.canvas;
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    this.renderer.setSize(r.width, r.height, true);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  bounds(): Bounds { return sceneBounds(this.store.project.walls); }

  fitCamera() {
    const { center, radius } = this.bounds();
    this.camera.position.set(center.x + radius * 1.15, radius * 1.25, center.z + radius * 1.15);
    this.controls.target.set(center.x, 60, center.z);
    this.controls.update();
  }

  rebuild() {
    disposeGroup(this.buildGroup);
    disposeGroup(this.itemGroup);
    this.doors = [];
    const p = this.store.project;
    for (const w of p.walls) {
      if (wallLen(w) < 2) continue;
      const built = buildWall(w, p.openings);
      this.buildGroup.add(built.group);
      this.doors.push(...built.doors);
    }
    buildFloors(this.store, this.buildGroup);
    for (const it of p.items) this.itemGroup.add(buildItem(it));
    const { center, radius } = this.bounds();
    layoutSun(this.sun, center, radius);
  }

  screenshot() {
    this.renderer.render(this.scene, this.camera);
    const a = document.createElement('a');
    a.href = this.canvas.toDataURL('image/png');
    a.download = `效果图_${Date.now()}.png`;
    a.click();
  }
}

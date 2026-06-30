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
import { sceneSignatures } from './signatures';
import { applyRenderSettings, type RenderSettingsState } from './render-settings';
import { RoomActions } from './room-actions';
import { syncPixelRatio } from './render-quality';
export class Viewer3D {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  controls: OrbitControls; sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; walk: Walk; actions: RoomActions;
  buildGroup = new THREE.Group(); itemGroup = new THREE.Group(); doors: DoorRef[] = [];
  visible = false; private dirty = true; private raf = 0; private needsRender = true;
  private shellSig = ''; private itemSig = '';
  private renderState: RenderSettingsState = { renderSig: '', cameraSig: '' };
  private timer = new THREE.Timer();
  private unsubs: (() => void)[] = [];
  private ro: ResizeObserver;
  constructor(public canvas: HTMLCanvasElement, public store: Store) {
    const kit = initScene(canvas, store.project.settings.renderQuality);
    this.renderer = kit.renderer;
    this.scene = kit.scene;
    this.camera = kit.camera;
    this.controls = kit.controls;
    this.sun = kit.sun;
    this.hemi = kit.hemi;
    this.scene.add(this.buildGroup, this.itemGroup);
    this.walk = new Walk(this);
    this.actions = new RoomActions(this);
    this.timer.connect(document);
    const markDirty = () => { this.dirty = true; this.requestRender(); };
    const controlChanged = () => this.requestRender();
    this.unsubs.push(
      this.store.on('change', markDirty),
      this.store.on('project', () => { this.dirty = true; this.fitCamera(); }),
      bindInteract(this),
      () => this.controls.removeEventListener('change', controlChanged),
    );
    this.controls.addEventListener('change', controlChanged);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.fitCamera();
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.unsubs.forEach((u) => u());
    this.ro.disconnect();
    disposeGroup(this.buildGroup);
    disposeGroup(this.itemGroup);
    this.timer.dispose();
    this.renderer.dispose();
  }
  setVisible(v: boolean) {
    this.visible = v;
    if (v) {
      this.resize();
      this.dirty = true;
      this.timer.reset();
      this.requestRender();
    }
    else if (this.walk.active) this.walk.exit();
  }
  private scheduleFrame() { if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.frame); }
  requestRender() {
    this.needsRender = true;
    this.scheduleFrame();
  }
  private frame = (timestamp?: number) => {
    this.raf = 0;
    if (!this.visible) return;
    this.timer.update(timestamp);
    const dt = Math.min(0.05, this.timer.getDelta());
    const settingsChanged = applyRenderSettings(this, this.renderState);
    let shouldRender = this.needsRender || settingsChanged;
    if (this.dirty) {
      this.rebuild();
      this.dirty = false;
      shouldRender = true;
    }
    const walkChanged = this.walk.step(dt);
    const actionChanged = this.actions.step(dt, this.walk.active);
    const controlsChanged = this.controls.enabled && this.controls.update();
    const activeMotion = walkChanged || actionChanged || controlsChanged || this.walk.hasActiveInput() || this.actions.hasActive();
    const q = this.store.project.settings.renderQuality;
    shouldRender = syncPixelRatio(this.canvas, this.renderer, activeMotion, q) || shouldRender;
    shouldRender ||= walkChanged || actionChanged || controlsChanged;
    if (shouldRender) { this.renderer.render(this.scene, this.camera); this.needsRender = false; }
    if (this.dirty || this.needsRender || activeMotion) this.scheduleFrame();
  };
  resize() {
    const host = this.canvas.parentElement ?? this.canvas;
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    this.renderer.setSize(r.width, r.height, true);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }
  bounds(): Bounds { return sceneBounds(this.store.project.walls); }
  fitCamera() {
    const { center, radius } = this.bounds();
    this.camera.position.set(center.x + radius * 1.15, radius * 1.25, center.z + radius * 1.15);
    this.controls.target.set(center.x, 60, center.z);
    this.controls.update();
    this.requestRender();
  }
  rebuild() {
    const sig = sceneSignatures(this.store);
    const p = this.store.project;
    if (sig.shell !== this.shellSig) {
      disposeGroup(this.buildGroup);
      this.doors = [];
      for (const w of p.walls) {
        if (wallLen(w) < 2) continue;
        const built = buildWall(w, p.openings);
        this.buildGroup.add(built.group);
        this.doors.push(...built.doors);
      }
      buildFloors(this.store, this.buildGroup);
      const { center, radius } = this.bounds();
      layoutSun(this.sun, center, radius, { intensity: p.settings.sunIntensity, azimuth: p.settings.sunAzimuth, elevation: p.settings.sunElevation });
      this.shellSig = sig.shell;
    }
    if (sig.items !== this.itemSig) {
      disposeGroup(this.itemGroup);
      for (const it of p.items) this.itemGroup.add(buildItem(it));
      this.itemSig = sig.items;
    }
    this.actions.refresh();
  }
  screenshot() {
    if (this.dirty) { this.rebuild(); this.dirty = false; }
    this.renderer.render(this.scene, this.camera);
    const a = document.createElement('a');
    a.href = this.canvas.toDataURL('image/png');
    a.download = `效果图_${Date.now()}.png`;
    a.click();
  }
}

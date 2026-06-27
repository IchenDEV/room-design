import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { actionOf, actionOwner, advanceAction, advanceIdle, toggleAction } from './action-data';

const RANGE = 285;

export class RoomActions {
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private t = 0;
  private active = false;
  private actionNodes: THREE.Object3D[] = [];
  private idleNodes: THREE.Object3D[] = [];

  constructor(private v: Viewer3D) {}

  refresh() {
    this.actionNodes.length = 0;
    this.idleNodes.length = 0;
    const scan = (root: THREE.Object3D) => root.traverse((o) => {
      if (actionOf(o)) this.actionNodes.push(o);
      if (o.userData.roomIdle) this.idleNodes.push(o);
    });
    scan(this.v.itemGroup);
    scan(this.v.buildGroup);
  }

  pointer(e: PointerEvent): boolean {
    if (!this.v.walk.active || e.button !== 0) return false;
    const r = this.v.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.v.camera);
    return this.hitAndToggle();
  }

  useFocused(): boolean {
    if (!this.v.walk.active) return false;
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.v.camera);
    return this.hitAndToggle();
  }

  step(dt: number, walking: boolean): boolean {
    this.t += dt;
    this.active = false;
    let changed = false;
    for (const o of this.actionNodes) {
      changed = advanceAction(o, dt, this.t) || changed;
      const a = actionOf(o);
      if (a && (Math.abs(a.target - a.value) > 0.002 || ((a.kind === 'flow' || a.kind === 'spinZ') && a.value > 0.03))) {
        this.active = true;
      }
    }
    const liveIdle = walking && (this.active || this.v.walk.hasActiveInput());
    for (const o of this.idleNodes) changed = advanceIdle(o, dt, this.t, liveIdle) || changed;
    return changed;
  }

  hasActive() { return this.active; }

  private hitAndToggle(): boolean {
    const hits = this.ray.intersectObjects([this.v.itemGroup, this.v.buildGroup], true);
    for (const hit of hits) {
      const owner = actionOwner(hit.object);
      if (!owner || hit.distance > RANGE) continue;
      if (toggleAction(owner)) {
        this.active = true;
        this.v.requestRender();
        return true;
      }
    }
    return false;
  }
}

import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { moveWithCollision } from './collision';

const EYE = 150;
const TMP = new THREE.Vector3();
const FWD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const NEXT = new THREE.Vector3();
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const USED_KEYS = [...MOVE_KEYS, 'ShiftLeft', 'ShiftRight', 'KeyE'];

/** 第一人称漫游 + 临近门自动开启动画 */
export class Walk {
  active = false;
  pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = -0.04;
  private keys = new Set<string>();
  private looking = false;
  private poseDirty = true;

  constructor(private v: Viewer3D) {
    const c = v.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (!this.active || e.button !== 0) return;
      if (this.v.actions.pointer(e)) { e.preventDefault(); return; }
      this.looking = true;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.active || !this.looking) return;
      this.yaw -= e.movementX * 0.0032;
      this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch - e.movementY * 0.0032));
      this.poseDirty = true;
      this.v.requestRender();
    });
    const stopLook = () => {
      if (!this.looking) return;
      this.looking = false;
      this.v.requestRender();
    };
    c.addEventListener('pointerup', stopLook);
    c.addEventListener('pointercancel', stopLook);
  }

  toggle() { this.active ? this.exit() : this.enter(); }

  enter() {
    const { center } = this.v.bounds();
    this.active = true;
    this.pos.set(center.x, EYE, center.z + 120);
    this.yaw = 0;
    this.pitch = -0.04;
    this.poseDirty = true;
    this.v.controls.enabled = false;
    this.v.store.patchUI({ walking: true });
    this.v.requestRender();
  }

  exit() {
    this.active = false;
    this.keys.clear();
    this.v.controls.enabled = true;
    const f = this.forward(FWD);
    this.v.controls.target.copy(this.pos).addScaledVector(f, 260);
    this.v.controls.update();
    this.v.store.patchUI({ walking: false });
    this.v.requestRender();
  }

  onKey(code: string, down: boolean) {
    if (!this.active) return false;
    if (!USED_KEYS.includes(code)) return false;
    if (code === 'KeyE') {
      const hadUse = this.keys.has(code);
      if (down) this.keys.add(code); else this.keys.delete(code);
      if (down && !hadUse) this.v.actions.useFocused();
      return true;
    }
    const had = this.keys.has(code);
    if (down) this.keys.add(code); else this.keys.delete(code);
    if (had !== down) this.v.requestRender();
    return true;
  }

  private forward(out = new THREE.Vector3()) { return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  private hasMoveKey() { return MOVE_KEYS.some((key) => this.keys.has(key)); }
  hasActiveInput() { return this.active && (this.looking || this.hasMoveKey()); }

  step(dt: number): boolean {
    let changed = false;
    // 门扇动画：漫游中靠近自动打开，离开/退出后缓缓关闭
    for (const d of this.v.doors) {
      d.pivot.getWorldPosition(TMP);
      const near = this.active && Math.hypot(TMP.x - this.pos.x, TMP.z - this.pos.z) < 170;
      const target = near || d.manualOpen ? d.openAngle : 0;
      const delta = target - d.pivot.rotation.y;
      if (Math.abs(delta) > 0.001) {
        d.pivot.rotation.y += delta * Math.min(1, dt * 4.2);
        changed = true;
      }
    }
    if (!this.active) return changed;
    const k = this.keys;
    const sp = (k.has('ShiftLeft') || k.has('ShiftRight') ? 420 : 230) * dt;
    const f = this.forward(FWD);
    const r = RIGHT.set(-f.z, 0, f.x);
    const next = NEXT.copy(this.pos);
    let moved = false;
    if (k.has('KeyW') || k.has('ArrowUp')) { next.addScaledVector(f, sp); moved = true; }
    if (k.has('KeyS') || k.has('ArrowDown')) { next.addScaledVector(f, -sp); moved = true; }
    if (k.has('KeyA') || k.has('ArrowLeft')) { next.addScaledVector(r, -sp); moved = true; }
    if (k.has('KeyD') || k.has('ArrowRight')) { next.addScaledVector(r, sp); moved = true; }
    if (!moved && !this.poseDirty) return changed;
    if (moved) this.pos.copy(moveWithCollision(this.v.store.project, this.pos, next));
    this.pos.y = EYE;
    const cam = this.v.camera;
    cam.position.copy(this.pos);
    cam.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.poseDirty = false;
    return true;
  }
}

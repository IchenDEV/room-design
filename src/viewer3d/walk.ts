import * as THREE from 'three';
import type { Viewer3D } from './viewer';

const EYE = 150;
const TMP = new THREE.Vector3();

/** 第一人称漫游 + 临近门自动开启动画 */
export class Walk {
  active = false;
  pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = -0.04;
  private keys = new Set<string>();
  private looking = false;

  constructor(private v: Viewer3D) {
    const c = v.canvas;
    c.addEventListener('pointerdown', (e) => { if (this.active && e.button === 0) { this.looking = true; c.setPointerCapture(e.pointerId); } });
    c.addEventListener('pointermove', (e) => {
      if (!this.active || !this.looking) return;
      this.yaw -= e.movementX * 0.0032;
      this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch - e.movementY * 0.0032));
    });
    c.addEventListener('pointerup', () => { this.looking = false; });
  }

  toggle() { this.active ? this.exit() : this.enter(); }

  enter() {
    const { center } = this.v.bounds();
    this.active = true;
    this.pos.set(center.x, EYE, center.z + 120);
    this.yaw = 0;
    this.pitch = -0.04;
    this.v.controls.enabled = false;
    this.v.store.patchUI({ walking: true });
  }

  exit() {
    this.active = false;
    this.keys.clear();
    this.v.controls.enabled = true;
    const f = this.forward();
    this.v.controls.target.copy(this.pos).addScaledVector(f, 260);
    this.v.controls.update();
    this.v.store.patchUI({ walking: false });
  }

  onKey(code: string, down: boolean) {
    if (!this.active) return false;
    const used = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
    if (!used.includes(code)) return false;
    if (down) this.keys.add(code); else this.keys.delete(code);
    return true;
  }

  private forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  step(dt: number) {
    // 门扇动画：漫游中靠近自动打开，离开/退出后缓缓关闭
    for (const d of this.v.doors) {
      d.pivot.getWorldPosition(TMP);
      const near = this.active && Math.hypot(TMP.x - this.pos.x, TMP.z - this.pos.z) < 170;
      const target = near ? d.openAngle : 0;
      d.pivot.rotation.y += (target - d.pivot.rotation.y) * Math.min(1, dt * 4.2);
    }
    if (!this.active) return;
    const k = this.keys;
    const sp = (k.has('ShiftLeft') || k.has('ShiftRight') ? 420 : 230) * dt;
    const f = this.forward();
    const r = new THREE.Vector3(-f.z, 0, f.x);
    if (k.has('KeyW') || k.has('ArrowUp')) this.pos.addScaledVector(f, sp);
    if (k.has('KeyS') || k.has('ArrowDown')) this.pos.addScaledVector(f, -sp);
    if (k.has('KeyA') || k.has('ArrowLeft')) this.pos.addScaledVector(r, -sp);
    if (k.has('KeyD') || k.has('ArrowRight')) this.pos.addScaledVector(r, sp);
    this.pos.y = EYE;
    const cam = this.v.camera;
    cam.position.copy(this.pos);
    cam.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }
}

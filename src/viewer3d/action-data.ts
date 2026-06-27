import * as THREE from 'three';

type ActionKind = 'slideZ' | 'hingeY' | 'glow' | 'printer' | 'flow' | 'spinZ';
type IdleKind = 'sway' | 'breathe' | 'bob';
type GlowMat = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

export interface RoomAction {
  kind: ActionKind;
  label: string;
  value: number;
  target: number;
  speed: number;
  open?: number;
  base?: number;
  phase?: number;
  parts?: THREE.Object3D[];
  mats?: GlowMat[];
  lights?: THREE.Light[];
  high?: number;
}

export interface DoorLike { manualOpen?: boolean }

interface RoomIdle {
  kind: IdleKind;
  amp: number;
  speed: number;
  phase: number;
  py: number;
  rz: number;
  sy: number;
}

export const actionOf = (o: THREE.Object3D): RoomAction | undefined =>
  o.userData.roomAction as RoomAction | undefined;

export const doorOf = (o: THREE.Object3D): DoorLike | undefined =>
  o.userData.doorRef as DoorLike | undefined;

export function actionOwner(o: THREE.Object3D | null): THREE.Object3D | null {
  for (let p = o; p; p = p.parent) if (actionOf(p) || doorOf(p)) return p;
  return null;
}

export function tagAction<T extends THREE.Object3D>(
  o: T, label: string, kind: ActionKind, data: Partial<RoomAction> = {},
): T {
  o.userData.roomAction = { kind, label, value: 0, target: 0, speed: 6, ...data };
  return o;
}

export function tagIdle<T extends THREE.Object3D>(o: T, kind: IdleKind, amp: number, speed: number): T {
  o.userData.roomIdle = {
    kind, amp, speed, phase: Math.random() * Math.PI * 2,
    py: o.position.y, rz: o.rotation.z, sy: o.scale.y,
  } satisfies RoomIdle;
  return o;
}

export function toggleAction(o: THREE.Object3D): boolean {
  const door = doorOf(o);
  if (door) {
    door.manualOpen = !door.manualOpen;
    return true;
  }
  const a = actionOf(o);
  if (!a) return false;
  a.target = a.target > 0.5 ? 0 : 1;
  return true;
}

const ease = (v: number) => v * v * (3 - 2 * v);

function glow(a: RoomAction, v: number) {
  const level = 0.04 + (a.high ?? 1.6) * v;
  for (const m of a.mats ?? []) m.emissiveIntensity = level;
  for (const light of a.lights ?? []) light.intensity = (a.high ?? 1.4) * v;
}

function opacity(a: RoomAction, v: number) {
  for (const m of a.mats ?? []) {
    m.transparent = true;
    m.opacity = 0.03 + 0.6 * v;
  }
}

export function advanceAction(o: THREE.Object3D, dt: number, t: number): boolean {
  const a = actionOf(o);
  if (!a) return false;
  const prev = a.value;
  a.value += (a.target - a.value) * Math.min(1, dt * a.speed);
  if (Math.abs(a.target - a.value) < 0.002) a.value = a.target;
  const v = ease(a.value);
  if (a.kind === 'slideZ') o.position.z = (a.base ?? 0) + (a.open ?? 18) * v;
  if (a.kind === 'hingeY') o.rotation.y = (a.base ?? 0) + (a.open ?? 1.15) * v;
  if (a.kind === 'glow') glow(a, v);
  if (a.kind === 'printer' && a.parts?.[0]) {
    a.parts[0].position.z = (a.base ?? 0) + (a.open ?? 24) * v;
    glow(a, v);
  }
  if (a.kind === 'flow') {
    opacity(a, v);
    (a.parts ?? o.children).forEach((p, i) => {
      p.visible = a.value > 0.03;
      p.scale.y = Math.max(0.05, v) * (1 + Math.sin(t * 8 + i) * 0.05);
    });
  }
  if (a.kind === 'spinZ') {
    a.phase = (a.phase ?? 0) + dt * 9 * a.value;
    o.rotation.z = (a.base ?? 0) + a.phase;
    glow(a, v);
  }
  return Math.abs(prev - a.value) > 0.001 || ((a.kind === 'flow' || a.kind === 'spinZ') && a.value > 0.03);
}

export function advanceIdle(o: THREE.Object3D, dt: number, t: number, live: boolean): boolean {
  const i = o.userData.roomIdle as RoomIdle | undefined;
  if (!i) return false;
  const wave = live ? Math.sin(t * i.speed + i.phase) * i.amp : 0;
  const prevY = o.position.y, prevZ = o.rotation.z, prevS = o.scale.y;
  if (i.kind === 'sway') o.rotation.z = i.rz + wave;
  if (i.kind === 'bob') o.position.y = i.py + wave;
  if (i.kind === 'breathe') o.scale.y = i.sy * (1 + wave);
  return Math.abs(prevY - o.position.y) + Math.abs(prevZ - o.rotation.z) + Math.abs(prevS - o.scale.y) > 0.0001 || (live && dt > 0);
}

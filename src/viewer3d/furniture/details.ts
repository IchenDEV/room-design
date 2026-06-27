import * as THREE from 'three';
import type { FurnKind, FurnTexture } from '../../core/catalog/catalog';
import { shade } from '../../core/geometry/vec';
import { tagAction, tagIdle } from '../action-data';
import { box, cyl, mat, softBox, sph } from './parts';

const screenMat = () => new THREE.MeshStandardMaterial({
  color: '#172230', emissive: 0x6fc8ff, emissiveIntensity: 0.04, roughness: 0.38,
});
const waterMat = () => new THREE.MeshPhysicalMaterial({
  color: 0x9eddf2, emissive: 0x6fbde0, emissiveIntensity: 0.25,
  roughness: 0.08, transparent: true, opacity: 0.02, depthWrite: false,
});

function glowScreen(g: THREE.Group, label: string, x: number, y: number, z: number, w: number, h: number) {
  const m = screenMat();
  const s = box(w, h, 0.9, m, x, y, z);
  const light = new THREE.PointLight(0xffd4a3, 0, 150);
  light.position.set(x, y + h * 0.15, z + 10);
  tagAction(s, label, 'glow', { mats: [m], lights: [light], high: 1.5, speed: 7 });
  g.add(s, light);
}

function drawers(g: THREE.Group, w: number, d: number, h: number, rows: number, cols: number, c: string, label: string) {
  const front = mat(shade(c, 15), 0.7), metal = mat('#c9c1b4', 0.3, 0.75);
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
    const p = new THREE.Group();
    const ww = w / cols - 7, hh = Math.min(h / (rows + 1), h * 0.18);
    p.position.set(-w / 2 + (w / cols) * (col + 0.5), h * (0.24 + r * 0.18), d / 2 + 3);
    p.add(softBox(ww, hh, 2, front, 0, 0, 0, 1.2));
    p.add(box(Math.min(24, ww * 0.36), 1.2, 1.2, metal, 0, hh * 0.12, 1.8));
    g.add(tagAction(p, label, 'slideZ', { base: p.position.z, open: 18, speed: 5.5 }));
  }
}

function cabinetDoors(g: THREE.Group, w: number, d: number, h: number, c: string, label: string) {
  const front = mat(shade(c, 10), 0.72), metal = mat('#c9c1b4', 0.3, 0.75);
  for (const s of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(s * w / 2, h / 2, d / 2 + 3);
    p.add(softBox(w / 2 - 5, h - 12, 2, front, -s * (w / 4 - 2.5), 0, 0, 1.4));
    p.add(box(1.4, Math.min(28, h * 0.22), 1.4, metal, -s * 8, 0, 1.6));
    g.add(tagAction(p, label, 'hingeY', { base: 0, open: -s * 1.12, speed: 5 }));
  }
}

function printerDetail(g: THREE.Group, w: number, d: number, h: number) {
  const a = new THREE.Group(), led = new THREE.MeshStandardMaterial({
    color: '#23414f', emissive: 0x6fdcff, emissiveIntensity: 0.04, roughness: 0.42,
  });
  const paper = box(w * 0.54, 0.6, d * 0.32, mat('#f7f1e6', 0.9), 0, h * 0.79, d * 0.3);
  a.add(paper, box(w * 0.12, 1.6, 1.2, led, w * 0.28, h * 0.82, d * 0.18));
  tagAction(a, '使用打印机', 'printer', { parts: [paper], mats: [led], base: paper.position.z, open: 24, high: 1.6 });
  g.add(a);
}

function waterFlow(g: THREE.Group, label: string, x: number, y: number, z: number, len: number) {
  const flow = new THREE.Group(), wm = waterMat();
  const streams: THREE.Object3D[] = [];
  flow.position.set(x, y, z);
  flow.add(sph(2.4, mat('#c8c2b6', 0.28, 0.8), 0, 2, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const stream = cyl(0.35, 0.18, len * (0.82 + i * 0.03), wm, Math.cos(a) * 2, -len / 2, Math.sin(a) * 2, 8);
    streams.push(stream);
    flow.add(stream);
  }
  streams.forEach((o) => { o.visible = false; });
  g.add(tagAction(flow, label, 'flow', { parts: streams, mats: [wm], speed: 7 }));
}

function lampDetail(g: THREE.Group, w: number, h: number) {
  const m = new THREE.MeshStandardMaterial({
    color: '#fff0c4', emissive: 0xffc56a, emissiveIntensity: 0.05, roughness: 0.55,
  });
  const bulb = sph(Math.max(2.5, w * 0.1), m, 0, h - w * 0.35, 0);
  const light = new THREE.PointLight(0xffc987, 0, 210);
  light.position.copy(bulb.position);
  tagAction(bulb, '打开灯光', 'glow', { mats: [m], lights: [light], high: 1.85, speed: 8 });
  g.add(bulb, light);
}

function washerDetail(g: THREE.Group, w: number, d: number, h: number) {
  const wheel = new THREE.Group(), m = new THREE.MeshStandardMaterial({
    color: '#2c3941', emissive: 0x7bdfff, emissiveIntensity: 0.03, roughness: 0.22,
  });
  wheel.position.set(0, h * 0.45, d / 2 + 3);
  wheel.add(box(w * 0.08, 1.3, 1.2, m, w * 0.16, 0, 0));
  g.add(tagAction(wheel, '启动洗衣机', 'spinZ', { mats: [m], high: 1.2 }));
}

export function decorateItem(g: THREE.Group, kind: FurnKind, w: number, d: number, h: number, c: string, _tex?: FurnTexture) {
  if (kind === 'officedesk') glowScreen(g, '打开电脑', 0, h + Math.min(w * 0.42, 62) * 0.3 + 9, -d * 0.22 + 2.6, Math.min(w * 0.34, 48), Math.min(w * 0.2, 28));
  if (kind === 'tvstand') glowScreen(g, '打开屏幕', 0, h + Math.min(w * 0.78, 145) * 0.28 + 8, -d * 0.18 + 2.8, Math.min(w * 0.62, 112), Math.min(w * 0.34, 64));
  if (kind === 'whiteboard') glowScreen(g, '打开投屏', 0, h * 0.62, 2.6, w * 0.78, w * 0.42);
  if (kind === 'printer') printerDetail(g, w, d, h);
  if (kind === 'filecabinet') drawers(g, w, d, h, Math.min(4, Math.max(2, Math.round(h / 48))), 1, c, '拉开文件抽屉');
  if (kind === 'dresser' || kind === 'nightstand') drawers(g, w, d, h, kind === 'dresser' ? 3 : 2, kind === 'dresser' ? 2 : 1, c, '拉开抽屉');
  if (kind === 'wardrobe' || kind === 'fridge') cabinetDoors(g, w, d, h, c, kind === 'fridge' ? '打开冰箱门' : '打开柜门');
  if (kind === 'counter') { cabinetDoors(g, w, d, h - 6, c, '打开柜子'); drawers(g, w, d, h, 1, Math.max(2, Math.round(w / 80)), c, '拉开收纳抽屉'); }
  if (kind === 'shower') waterFlow(g, '打开花洒', -w / 2 + 14, h - 23, -d / 2 + 12, h * 0.66);
  if (kind === 'bathsink') waterFlow(g, '打开水龙头', 0, h + 18, -d * 0.18, 30);
  if (kind === 'waterdispenser') waterFlow(g, '接一杯温水', 0, h * 0.56, d * 0.42 + 5, 26);
  if (kind === 'lamp') lampDetail(g, w, h);
  if (kind === 'washer') washerDetail(g, w, d, h);
  if (kind === 'plant') tagIdle(g, 'sway', 0.045, 1.8);
  if (kind === 'sofa' || kind === 'bed' || kind === 'rug') tagIdle(g, 'breathe', 0.012, 1.15);
  if (kind === 'chair' || kind === 'officechair' || kind === 'stool' || kind === 'bench') tagIdle(g, 'bob', 0.8, 1.25);
}

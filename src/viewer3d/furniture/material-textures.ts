import * as THREE from 'three';
import type { FurnTexture } from '../../core/catalog/catalog';
import { shade } from '../../core/geometry/vec';

const cache = new Map<string, THREE.CanvasTexture>();

const hash = (text: string) => Array.from(text).reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 17);
const rnd = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function paint(texture: FurnTexture, base: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const r = rnd(hash(`${texture}:${base}`));
  x.fillStyle = base;
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = shade(base, -30);
  x.lineWidth = 1.2;
  if (texture === 'wood' || texture === 'darkWood') {
    for (let y = 10; y < 256; y += 18) {
      x.beginPath(); x.moveTo(0, y);
      x.bezierCurveTo(70, y + r() * 16 - 8, 150, y + r() * 16 - 8, 256, y + r() * 10 - 5);
      x.stroke();
    }
  } else if (texture === 'fabric' || texture === 'felt' || texture === 'plant') {
    for (let i = 0; i < 5000; i++) {
      x.fillStyle = shade(base, Math.floor(r() * 34 - 17));
      x.fillRect(r() * 256, r() * 256, 1.2, 1.2);
    }
  } else if (texture === 'leather') {
    for (let i = 0; i < 1300; i++) {
      x.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.08})`;
      x.fillRect(r() * 256, r() * 256, 1.5, 1.5);
    }
    x.setLineDash([7, 8]);
    for (let y = 20; y < 256; y += 44) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y + 22); x.stroke(); }
    x.setLineDash([]);
  } else if (texture === 'metal' || texture === 'plastic') {
    for (let i = -256; i < 256; i += 18) { x.beginPath(); x.moveTo(i, 256); x.lineTo(i + 256, 0); x.stroke(); }
  } else if (texture === 'glass') {
    const g = x.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  } else if (texture === 'stone' || texture === 'ceramic') {
    for (let i = 0; i < 18; i++) {
      x.beginPath();
      let px = r() * 256, py = 0; x.moveTo(px, py);
      while (py < 256) { px += r() * 28 - 14; py += 18 + r() * 26; x.lineTo(px, py); }
      x.stroke();
    }
  } else {
    for (let i = -256; i < 320; i += 18) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke();
      x.beginPath(); x.moveTo(i, 256); x.lineTo(i + 256, 0); x.stroke();
    }
  }
  return c;
}

export function furnitureMap(texture: FurnTexture, base: string): THREE.CanvasTexture {
  const key = `${texture}:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = new THREE.CanvasTexture(paint(texture, base));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

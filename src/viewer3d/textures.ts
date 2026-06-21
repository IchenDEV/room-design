import * as THREE from 'three';
import { floorOf } from '../core/catalog/catalog';
import { shade } from '../core/geometry/vec';
import type { WallTexture } from '../core/types';

const cache = new Map<string, THREE.CanvasTexture>();

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(type: string, base: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  const rnd = mulberry32(7);
  x.fillStyle = base;
  x.fillRect(0, 0, 512, 512);

  if (type === 'wood' || type === 'woodPanel') {
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y = (512 / rows) * r;
      const off = (r % 2) * 256;
      for (let i = -1; i < 2; i++) {
        const px = off + i * 512 - 128;
        x.fillStyle = shade(base, Math.floor(rnd() * 26 - 13));
        x.fillRect(px, y, 510, 512 / rows - 2);
        x.strokeStyle = 'rgba(0,0,0,0.18)';
        x.strokeRect(px, y, 510, 512 / rows - 2);
        for (let g = 0; g < 4; g++) {
          x.strokeStyle = `rgba(80,50,20,${0.05 + rnd() * 0.06})`;
          x.beginPath();
          const gy = y + rnd() * (512 / rows);
          x.moveTo(px, gy);
          x.bezierCurveTo(px + 150, gy + rnd() * 8 - 4, px + 330, gy + rnd() * 8 - 4, px + 510, gy);
          x.stroke();
        }
      }
    }
  } else if (type === 'tile' || type === 'brick') {
    const n = type === 'brick' ? 8 : 4;
    const h = type === 'brick' ? 64 : 128;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 512 / h; j++) {
        const off = type === 'brick' && j % 2 ? 32 : 0;
        x.fillStyle = shade(base, Math.floor(rnd() * 14 - 7));
        x.fillRect(i * (512 / n) - off + 2, j * h + 2, 512 / n - 4, h - 4);
      }
    }
  } else if (type === 'plaster' || type === 'concrete') {
    for (let i = 0; i < 11000; i++) {
      const d = type === 'concrete' ? Math.floor(rnd() * 44 - 22) : Math.floor(rnd() * 24 - 12);
      x.fillStyle = shade(base, d);
      x.fillRect(rnd() * 512, rnd() * 512, 1.5 + rnd() * 2, 1.5 + rnd() * 2);
    }
  } else if (type === 'wallpaper') {
    for (let i = 0; i < 512; i += 64) {
      x.fillStyle = shade(base, i % 128 === 0 ? 12 : -5);
      x.fillRect(i, 0, 30, 512);
      x.strokeStyle = 'rgba(255,255,255,0.24)'; x.beginPath(); x.moveTo(i + 31, 0); x.lineTo(i + 31, 512); x.stroke();
      x.strokeStyle = 'rgba(55,70,75,0.14)'; x.beginPath(); x.moveTo(i + 2, 0); x.lineTo(i + 2, 512); x.stroke();
    }
    for (let y = 44; y < 512; y += 92) {
      for (let px = 34; px < 512; px += 96) {
        const j = rnd() * 8 - 4;
        x.strokeStyle = 'rgba(82,96,84,0.24)'; x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(px + j, y + 26);
        x.bezierCurveTo(px + 18 + j, y - 10, px + 46 + j, y - 8, px + 58 + j, y + 26);
        x.stroke();
        x.beginPath(); x.ellipse(px + 20 + j, y + 10, 9, 16, -0.7, 0, Math.PI * 2);
        x.ellipse(px + 42 + j, y + 10, 9, 16, 0.7, 0, Math.PI * 2);
        x.stroke();
      }
    }
    for (let i = 0; i < 2400; i++) {
      x.fillStyle = `rgba(255,255,255,${0.025 + rnd() * 0.04})`; x.fillRect(rnd() * 512, rnd() * 512, 1, 1);
    }
  } else if (type === 'marble') {
    for (let v = 0; v < 14; v++) {
      x.strokeStyle = `rgba(120,120,128,${0.08 + rnd() * 0.12})`;
      x.lineWidth = 0.8 + rnd() * 1.6;
      x.beginPath();
      let px = rnd() * 512, py = 0;
      x.moveTo(px, py);
      while (py < 512) {
        px += rnd() * 60 - 30; py += 28 + rnd() * 36;
        x.lineTo(px, py);
      }
      x.stroke();
    }
  } else {
    for (let i = 0; i < 8000; i++) {
      x.fillStyle = shade(base, Math.floor(rnd() * 30 - 15));
      x.fillRect(rnd() * 512, rnd() * 512, 2, 2);
    }
  }
  return c;
}

export function floorTexture(floorId: string): THREE.CanvasTexture {
  const hit = cache.get(floorId); if (hit) return hit;
  const mat = floorOf(floorId);
  const tex = new THREE.CanvasTexture(paint(mat.type, mat.base));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(1 / 320, 1 / 320);
  cache.set(floorId, tex);
  return tex;
}

export function wallTexture(texture: WallTexture, base: string): THREE.CanvasTexture {
  const key = `wall:${texture}:${base}`;
  const hit = cache.get(key); if (hit) return hit;
  const tex = new THREE.CanvasTexture(paint(texture, base));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const repeat = texture === 'wallpaper' ? 1 / 220 : 1 / 180; tex.repeat.set(repeat, repeat);
  cache.set(key, tex);
  return tex;
}

export function skyTexture(): THREE.CanvasTexture {
  const key = '_sky';
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#aecbe8');
  g.addColorStop(0.55, '#dceaf5');
  g.addColorStop(1, '#f3efe6');
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

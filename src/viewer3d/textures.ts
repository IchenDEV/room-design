import * as THREE from 'three';
import { floorOf } from '../core/catalog/catalog';
import { shade } from '../core/geometry/vec';

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

  if (type === 'wood') {
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
  } else if (type === 'tile') {
    const n = 4;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        x.fillStyle = shade(base, Math.floor(rnd() * 14 - 7));
        x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
      }
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
  const hit = cache.get(floorId);
  if (hit) return hit;
  const mat = floorOf(floorId);
  const tex = new THREE.CanvasTexture(paint(mat.type, mat.base));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(floorId, tex);
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

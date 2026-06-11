import * as THREE from 'three';
import { shade } from '../core/geometry';

/** 纹理画布尺寸 512px 对应真实世界 256cm */
export const TEX_WORLD_SIZE = 256;

const cache = new Map<string, THREE.CanvasTexture>();

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function floorTexture(kind: 'wood' | 'tile' | 'marble' | 'carpet', base: string): THREE.CanvasTexture {
  const key = `${kind}|${base}`;
  if (cache.has(key)) return cache.get(key)!;

  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(20260611);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  if (kind === 'wood') {
    for (let row = 0; row < 8; row++) {
      const y = row * 64;
      ctx.fillStyle = shade(base, Math.floor((rnd() - 0.5) * 30));
      ctx.fillRect(0, y, 512, 64);
      // 木纹
      ctx.strokeStyle = 'rgba(72,44,14,0.10)';
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const gy = y + 5 + rnd() * 54;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        for (let x = 0; x <= 512; x += 64) ctx.lineTo(x, gy + (rnd() - 0.5) * 5);
        ctx.stroke();
      }
      // 横缝 + 错缝竖缝
      ctx.fillStyle = 'rgba(40,24,9,0.35)';
      ctx.fillRect(0, y, 512, 2);
      const off = (row % 2) * 256 + 128;
      for (const sx of [off, off + 256]) ctx.fillRect(((sx % 512) + 512) % 512, y, 2, 64);
    }
  } else if (kind === 'tile') {
    for (let r = 0; r < 4; r++) {
      for (let q = 0; q < 4; q++) {
        ctx.fillStyle = shade(base, Math.floor((rnd() - 0.5) * 14));
        ctx.fillRect(q * 128, r * 128, 128, 128);
      }
    }
    ctx.strokeStyle = 'rgba(30,34,40,0.22)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(512, i * 128); ctx.stroke();
    }
  } else if (kind === 'marble') {
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(110,120,134,${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.8 + rnd() * 2.2;
      ctx.beginPath();
      let x = rnd() * 512, y = rnd() * 512;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        const nx = x + (rnd() - 0.5) * 260, ny = y + (rnd() - 0.5) * 260;
        ctx.quadraticCurveTo(x + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 120, nx, ny);
        x = nx; y = ny;
      }
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const g = ctx.createRadialGradient(rnd() * 512, rnd() * 512, 10, rnd() * 512, rnd() * 512, 140);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    }
  } else {
    // carpet：噪点编织质感
    for (let i = 0; i < 9000; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * 512, rnd() * 512, 1.6, 1.6);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / TEX_WORLD_SIZE, 1 / TEX_WORLD_SIZE);
  cache.set(key, tex);
  return tex;
}

/** 天空背景竖向渐变 */
export function skyTexture(): THREE.CanvasTexture {
  const key = '_sky';
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#b7d2ec');
  g.addColorStop(0.55, '#dfeaf4');
  g.addColorStop(1, '#f3f6f9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

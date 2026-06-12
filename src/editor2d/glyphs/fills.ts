import type { FurnTexture } from '../../core/catalog/catalog';
import { shade } from '../../core/geometry/vec';

const cache = new Map<string, HTMLCanvasElement>();

function dot(x: CanvasRenderingContext2D, color: string, n: number) {
  x.fillStyle = color;
  for (let i = 0; i < n; i++) x.fillRect((i * 17) % 64, (i * 29) % 64, 1.2, 1.2);
}

function canvas(texture: FurnTexture, base: string) {
  const key = `${texture}:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = base;
  x.fillRect(0, 0, 64, 64);
  x.strokeStyle = shade(base, -35);
  x.lineWidth = 1;
  if (texture === 'wood' || texture === 'darkWood') {
    for (let y = 8; y < 64; y += 12) {
      x.beginPath();
      x.moveTo(0, y);
      x.bezierCurveTo(18, y - 4, 36, y + 4, 64, y - 1);
      x.stroke();
    }
  } else if (texture === 'fabric' || texture === 'felt') {
    dot(x, shade(base, texture === 'felt' ? -22 : 24), texture === 'felt' ? 180 : 90);
  } else if (texture === 'leather') {
    dot(x, shade(base, 24), 70);
    x.setLineDash([4, 5]);
    for (let y = 10; y < 64; y += 18) {
      x.beginPath(); x.moveTo(0, y); x.lineTo(64, y + 7); x.stroke();
    }
    x.setLineDash([]);
  } else if (texture === 'metal') {
    for (let x0 = -64; x0 < 64; x0 += 10) {
      x.beginPath(); x.moveTo(x0, 64); x.lineTo(x0 + 64, 0); x.stroke();
    }
  } else if (texture === 'glass') {
    x.fillStyle = 'rgba(255,255,255,0.28)';
    x.fillRect(0, 0, 64, 64);
    x.strokeStyle = 'rgba(255,255,255,0.55)';
    x.beginPath(); x.moveTo(8, 56); x.lineTo(56, 8); x.stroke();
  } else if (texture === 'stone' || texture === 'ceramic') {
    for (let i = 0; i < 7; i++) {
      x.beginPath(); x.moveTo(i * 11, 0); x.bezierCurveTo(i * 11 - 8, 22, i * 11 + 12, 38, i * 11, 64); x.stroke();
    }
  } else if (texture === 'rattan') {
    for (let i = -64; i < 80; i += 10) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke();
      x.beginPath(); x.moveTo(i, 64); x.lineTo(i + 64, 0); x.stroke();
    }
  } else if (texture === 'plant') {
    dot(x, shade(base, -28), 100);
  } else {
    x.fillStyle = 'rgba(255,255,255,0.18)';
    x.fillRect(0, 0, 64, 18);
  }
  cache.set(key, c);
  return c;
}

export function fillFor(ctx: CanvasRenderingContext2D, texture: FurnTexture | undefined, base: string) {
  return texture ? ctx.createPattern(canvas(texture, base), 'repeat') ?? base : base;
}

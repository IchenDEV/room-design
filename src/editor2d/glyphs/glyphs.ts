import type { FurnKind, FurnDef, FurnTexture } from '../../core/catalog/catalog';
import { defaultTexture } from '../../core/catalog/catalog';
import { prep } from './util';
import type { GlyphFn } from './util';
import { sofa, chair, stool, barstool, bench } from './seating';
import { table, roundtable, tvstand, shelf, officedesk } from './tables';
import { wardrobe, nightstand, dresser, fridge, washer, counter } from './storage';
import { bed, toilet, bathsink, bathtub, shower } from './bedbath';
import { officechair, filecabinet, whiteboard, printer, partition } from './office';
import { rug, lamp, plant } from './decor';

const REG: Record<FurnKind, GlyphFn> = {
  sofa, chair, stool, barstool, bench,
  table, roundtable, tvstand, shelf, officedesk,
  wardrobe, nightstand, dresser, fridge, washer, counter,
  bed, toilet, bathsink, bathtub, shower,
  officechair, filecabinet, whiteboard, printer, partition,
  rug, lamp, plant,
};

/** 在已平移至中心的画布上绘制家具图例（w/d 像素） */
export function drawGlyph(
  ctx: CanvasRenderingContext2D, kind: FurnKind, w: number, d: number,
  color: string, texture?: FurnTexture,
) {
  const line = prep(ctx, color, texture);
  (REG[kind] ?? table)(ctx, w, d, color, line);
}

/** 素材卡缩略图 */
export function drawThumb(canvas: HTMLCanvasElement, def: FurnDef) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 76, H = canvas.clientHeight || 54;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const k = Math.min((W - 16) / def.w, (H - 12) / def.d);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  drawGlyph(ctx, def.kind, def.w * k, def.d * k, def.color, defaultTexture(def));
  ctx.restore();
}

import type { Item, Project, RoomMeta } from '../types';
import type { Store } from '../store/store';
import { defaultTexture, defOf } from '../catalog/catalog';
import { uid } from '../types';
import type { TemplateRoom, TemplateStyle } from './analysis';

const PALETTES: Record<TemplateStyle, { wall: string; floor: string; ceiling: string }> = {
  warm: { wall: '#efe9dd', floor: 'woodLight', ceiling: '#f5f2eb' },
  minimal: { wall: '#dfe4e7', floor: 'concreteMicro', ceiling: '#eef1f2' },
  bright: { wall: '#e6edf0', floor: 'tileTerrazzo', ceiling: '#f6f7f4' },
  work: { wall: '#d8d2c8', floor: 'carpetGray', ceiling: '#f0eee8' },
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function ensureMeta(p: Project, r: TemplateRoom): RoomMeta {
  const old = r.room.metaId ? p.roomMetas.find((m) => m.id === r.room.metaId) : undefined;
  if (old) return old;
  const meta = { id: uid('r'), anchor: { ...r.centroid }, name: r.name, floor: 'woodLight' };
  p.roomMetas.push(meta);
  return meta;
}

function pointInRoom(r: TemplateRoom, defId: string, rx: number, ry: number) {
  const d = defOf(defId);
  const xPad = Math.min(60, r.bounds.w / 5) + d.w / 2;
  const yPad = Math.min(60, r.bounds.d / 5) + d.d / 2;
  return {
    x: clamp(r.bounds.minX + r.bounds.w * rx, r.bounds.minX + xPad, r.bounds.maxX - xPad),
    y: clamp(r.bounds.minY + r.bounds.d * ry, r.bounds.minY + yPad, r.bounds.maxY - yPad),
  };
}

function addItem(p: Project, ids: string[], r: TemplateRoom, defId: string, rx: number, ry: number, rot = 0) {
  const def = defOf(defId), pt = pointInRoom(r, defId, rx, ry);
  const item: Item = {
    id: uid('i'), defId, x: pt.x, y: pt.y, rot, w: def.w, d: def.d, h: def.h,
    color: def.color, texture: defaultTexture(def), z: def.surfaceZ,
  };
  p.items.push(item); ids.push(item.id);
}

function applyPalette(p: Project, r: TemplateRoom, style: TemplateStyle) {
  const pal = PALETTES[style], meta = ensureMeta(p, r);
  meta.floor = pal.floor;
  meta.ceiling = { style: style === 'bright' ? 'cove' : 'tray', drop: 16, inset: 54, color: pal.ceiling };
  p.settings.showCeiling = true;
  p.settings.sunIntensity = style === 'bright' ? 3.1 : style === 'minimal' ? 2.6 : 2.2;
  p.settings.sunElevation = style === 'work' ? 58 : 52;
  p.walls.forEach((w) => { if (w.material !== 'glass') { w.color = pal.wall; w.texture = 'paint'; } });
}

const selectItems = (s: Store, ids: string[]) => {
  if (ids.length) s.setSel(ids.length === 1 ? { kind: 'item', id: ids[0] } : { kind: 'multi', ids });
};

export const applyMoodPlan = (s: Store, r: TemplateRoom, style: TemplateStyle) => {
  s.commit((p) => applyPalette(p, r, style)); return 0;
};

export function applyLivingPlan(s: Store, r: TemplateRoom, style: TemplateStyle): number {
  const ids: string[] = [];
  s.commit((p) => {
    applyPalette(p, r, style);
    addItem(p, ids, r, r.area < 18 ? 'sofa2' : 'sofa4', 0.28, 0.54, 90);
    addItem(p, ids, r, 'coffee-nest', 0.53, 0.54, 90);
    addItem(p, ids, r, 'media-low', 0.82, 0.54, 270);
    addItem(p, ids, r, 'living-rug-xl', 0.54, 0.54, 90);
    addItem(p, ids, r, 'floor-lamp-arc', 0.25, 0.25);
    addItem(p, ids, r, 'plant-tall', 0.86, 0.78);
  });
  selectItems(s, ids); return ids.length;
}

export function applyWorkPlan(s: Store, r: TemplateRoom, style: TemplateStyle): number {
  const ids: string[] = [];
  s.commit((p) => {
    applyPalette(p, r, style);
    addItem(p, ids, r, r.area < 12 ? 'desk-120' : 'desk-160', 0.72, 0.28, 180);
    addItem(p, ids, r, 'chair-ergo', 0.72, 0.43, 180);
    addItem(p, ids, r, 'monitor-wide', 0.72, 0.23, 180);
    addItem(p, ids, r, 'keyboard', 0.72, 0.31, 180);
    addItem(p, ids, r, 'lamp-floor-office', 0.90, 0.24);
    addItem(p, ids, r, 'plant-office-m', 0.88, 0.72);
  });
  selectItems(s, ids); return ids.length;
}

export function applyDiningPlan(s: Store, r: TemplateRoom, style: TemplateStyle): number {
  const ids: string[] = [];
  s.commit((p) => {
    applyPalette(p, r, style);
    addItem(p, ids, r, r.area > 24 ? 'dtable-6' : 'dtable-4', 0.50, 0.48, 90);
    addItem(p, ids, r, 'dining-chair-pad', 0.32, 0.48, 90);
    addItem(p, ids, r, 'dining-chair-pad', 0.68, 0.48, 270);
    addItem(p, ids, r, 'dining-chair-wood', 0.50, 0.26, 180);
    addItem(p, ids, r, 'sideboard', 0.84, 0.78, 180);
    addItem(p, ids, r, 'plant-tall', 0.16, 0.78);
  });
  selectItems(s, ids); return ids.length;
}

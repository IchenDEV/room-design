import type { Item, RoomPoly } from '../types';
import type { Store } from '../store/store';
import { defOf } from '../catalog/catalog';
import { pointInPoly } from '../geometry/polygon';
import { roomName } from '../store/selectors';

export type TemplateStyle = 'warm' | 'minimal' | 'bright' | 'work';
export interface TemplateBounds { minX: number; minY: number; maxX: number; maxY: number; w: number; d: number }
export interface TemplateRoom {
  key: string; name: string; area: number; centroid: { x: number; y: number };
  bounds: TemplateBounds; items: Item[]; kinds: Set<string>; cats: Set<string>; room: RoomPoly;
}
export interface TemplateAnalysis {
  rooms: TemplateRoom[]; target: TemplateRoom | null; totalArea: number; itemCount: number; notes: string[];
}

const boundsOf = (poly: { x: number; y: number }[]): TemplateBounds => {
  const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, d: maxY - minY };
};

function roomItems(items: Item[], r: RoomPoly): Item[] {
  return items.filter((it) => pointInPoly({ x: it.x, y: it.y }, r.poly));
}

function decorateRoom(s: Store, room: RoomPoly, idx: number): TemplateRoom {
  const items = roomItems(s.project.items, room);
  const defs = items.map((it) => defOf(it.defId));
  return {
    key: room.metaId ?? `room-${idx}`, name: roomName(s, room), area: room.area / 10000,
    centroid: room.centroid, bounds: boundsOf(room.poly), items,
    kinds: new Set(defs.map((d) => d.kind)), cats: new Set(defs.map((d) => d.cat)), room,
  };
}

function selectedRoom(s: Store, rooms: TemplateRoom[]): TemplateRoom | null {
  const sel = s.sel;
  if (sel?.kind === 'room') return rooms.find((r) => r.room.metaId === sel.metaId) ?? null;
  if (sel?.kind !== 'item') return null;
  const it = s.project.items.find((x) => x.id === sel.id);
  return it ? rooms.find((r) => pointInPoly({ x: it.x, y: it.y }, r.room.poly)) ?? null : null;
}

export function analyzeTemplateTarget(s: Store): TemplateAnalysis {
  const rooms = s.rooms.map((r, i) => decorateRoom(s, r, i));
  const target = selectedRoom(s, rooms) ?? rooms[0] ?? null;
  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
  const notes: string[] = [];
  if (!rooms.length) notes.push('还没有识别到闭合房间');
  if (rooms.length && s.project.items.length === 0) notes.push('当前方案还没有家具');
  if (target && target.items.length < Math.max(2, target.area / 8)) notes.push('目标房间陈设偏少');
  return { rooms, target, totalArea, itemCount: s.project.items.length, notes };
}

import type { Store } from './store';
import type { Item, Measure, Opening, ResolvedCeiling, RoomMeta, RoomPoly, Selection, Wall } from '../types';
import { normalizeCeiling } from '../types';
import { wallLen } from '../geometry/vec';
import { polygonPerimeter } from '../geometry/polygon';

export const wallOf = (s: Store, id: string): Wall | undefined => s.project.walls.find((w) => w.id === id);
export const openingOf = (s: Store, id: string): Opening | undefined => s.project.openings.find((o) => o.id === id);
export const itemOf = (s: Store, id: string): Item | undefined => s.project.items.find((i) => i.id === id);
export const measureOf = (s: Store, id: string): Measure | undefined => s.project.measures?.find((m) => m.id === id);
export const metaOf = (s: Store, id: string): RoomMeta | undefined => s.project.roomMetas.find((m) => m.id === id);
export const roomByMeta = (s: Store, metaId: string): RoomPoly | undefined => s.rooms.find((r) => r.metaId === metaId);

export const openingsOnWall = (s: Store, wallId: string): Opening[] =>
  s.project.openings.filter((o) => o.wallId === wallId);

export const roomName = (s: Store, r: RoomPoly): string =>
  (r.metaId && metaOf(s, r.metaId)?.name) || '房间';

export const roomFloor = (s: Store, r: RoomPoly): string =>
  (r.metaId && metaOf(s, r.metaId)?.floor) || 'woodLight';

export const roomCeiling = (s: Store, r: RoomPoly): ResolvedCeiling =>
  normalizeCeiling(r.metaId ? metaOf(s, r.metaId)?.ceiling : undefined);

export interface Stats { walls: number; rooms: number; items: number; area: number; wallLen: number }

export const stats = (s: Store): Stats => ({
  walls: s.project.walls.length,
  rooms: s.rooms.length,
  items: s.project.items.length,
  area: s.rooms.reduce((acc, r) => acc + r.area, 0) / 10000,
  wallLen: s.project.walls.reduce((acc, w) => acc + wallLen(w), 0) / 100,
});

export const roomPerimeter = (r: RoomPoly): number => polygonPerimeter(r.poly) / 100;

export const selKey = (sel: Selection | null): string =>
  sel ? (sel.kind === 'room' ? `room:${sel.metaId}` : sel.kind === 'multi' ? `multi:${sel.ids.join(',')}` : `${sel.kind}:${sel.id}`) : '';

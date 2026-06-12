import type { DoorStyle, DoorSwing, Item, Opening, Project, RoomMeta, Wall, WallMaterial } from '../types';
import { defaultSettings, uid } from '../types';
import { defaultTexture, defOf } from '../catalog/catalog';

export const mkWall = (
  ax: number, ay: number, bx: number, by: number,
  thickness = 20, material?: WallMaterial, color = '#e8e4da', height = 280,
): Wall => ({ id: uid('w'), a: { x: ax, y: ay }, b: { x: bx, y: by }, thickness, height, color, material });

export interface OpenOpts { h?: number; sill?: number; flip?: boolean; style?: DoorStyle; swing?: DoorSwing }

export const mkDoor = (w: Wall, t: number, width = 90, o: OpenOpts = {}): Opening => ({
  id: uid('o'), wallId: w.id, kind: 'door', t, width,
  height: o.h ?? 210, sill: 0, flip: o.flip ?? false, style: o.style, swing: o.swing ?? 'single',
});

export const mkWin = (w: Wall, t: number, width = 150, o: OpenOpts = {}): Opening => ({
  id: uid('o'), wallId: w.id, kind: 'window', t, width,
  height: o.h ?? 140, sill: o.sill ?? 90, flip: o.flip ?? false,
});

export const mkItem = (defId: string, x: number, y: number, rot = 0, color?: string): Item => {
  const d = defOf(defId);
  return { id: uid('i'), defId, x, y, rot, w: d.w, d: d.d, h: d.h, color, texture: defaultTexture(d) };
};

export const mkMeta = (name: string, x: number, y: number, floor: string): RoomMeta =>
  ({ id: uid('r'), anchor: { x, y }, name, floor });

export const mkProject = (
  name: string, walls: Wall[], openings: Opening[], items: Item[], roomMetas: RoomMeta[],
): Project => ({ version: 1, name, walls, openings, items, roomMetas, settings: defaultSettings() });

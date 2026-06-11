/** 所有长度单位均为厘米 (cm)，平面坐标系 y 轴朝上（北） */

export interface Pt { x: number; y: number }

export interface Wall {
  id: string;
  ax: number; ay: number;
  bx: number; by: number;
  thickness: number;
  height: number;
}

export type OpeningKind = 'door' | 'window';

export interface Opening {
  id: string;
  wallId: string;
  kind: OpeningKind;
  /** 中心点在墙体 A->B 上的参数位置 0..1 */
  t: number;
  width: number;
  height: number;
  /** 离地高度（门为 0） */
  sill: number;
}

export interface Item {
  id: string;
  defId: string;
  x: number; y: number;
  /** 平面逆时针旋转角（度） */
  rot: number;
  w: number; d: number; h: number;
  color?: string;
}

export interface RoomMeta {
  id: string;
  /** 锚点：位于房间多边形内部，用于在墙体编辑后重新匹配房间 */
  anchor: Pt;
  name?: string;
  floor?: string;
}

export interface Settings {
  wallHeight: number;
  wallThickness: number;
  wallColor: string;
  showCeiling: boolean;
}

export interface Project {
  version: 1;
  walls: Wall[];
  openings: Opening[];
  items: Item[];
  roomMetas: RoomMeta[];
  settings: Settings;
}

/** 由墙体推导出的房间多边形 */
export interface RoomPoly {
  poly: Pt[];
  /** 面积 cm² */
  area: number;
  centroid: Pt;
  metaId: string | null;
}

export type Selection =
  | { kind: 'wall'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'room'; metaId: string };

export type Tool =
  | { type: 'select' }
  | { type: 'wall' }
  | { type: 'rect' }
  | { type: 'door' }
  | { type: 'window' }
  | { type: 'place'; defId: string };

export const uid = () => Math.random().toString(36).slice(2, 10);

export function defaultSettings(): Settings {
  return { wallHeight: 280, wallThickness: 24, wallColor: '#f5f2ec', showCeiling: false };
}

export function emptyProject(): Project {
  return { version: 1, walls: [], openings: [], items: [], roomMetas: [], settings: defaultSettings() };
}

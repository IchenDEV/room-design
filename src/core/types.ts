// 核心数据模型：单位统一为厘米(cm)，平面坐标 y 轴朝北(屏幕上方)
export interface Pt { x: number; y: number }
export interface Guide { a: Pt; b: Pt; label?: string }

export type WallMaterial = 'solid' | 'glass';

export interface Wall {
  id: string;
  a: Pt;
  b: Pt;
  thickness: number;   // cm
  height: number;      // cm
  color: string;       // 3D 墙面色（实体墙）
  material?: WallMaterial;
}

export type OpeningKind = 'door' | 'window';
export type DoorStyle = 'wood' | 'glass';
export type DoorSwing = 'single' | 'double';
export type FurnTexture =
  | 'fabric' | 'leather' | 'wood' | 'darkWood' | 'metal' | 'glass'
  | 'stone' | 'ceramic' | 'rattan' | 'felt' | 'plastic' | 'plant';

export interface Opening {
  id: string;
  wallId: string;
  kind: OpeningKind;
  t: number;           // 在墙上的中心位置 0..1
  width: number;
  height: number;
  sill: number;        // 窗台高（窗有效）
  flip: boolean;       // 沿墙左右翻转
  style?: DoorStyle;   // 门：木门/玻璃门
  swing?: DoorSwing;   // 门：单开/双开
}

export interface Item {
  id: string;
  defId: string;
  x: number; y: number;
  rot: number;         // 度
  w: number; d: number; h: number;
  color?: string;
  texture?: FurnTexture;
  flipX?: boolean;
  z?: number;          // 离地高度 cm，缺省 0（贴地）
}

export interface ItemGroup {
  id: string;
  name: string;
  itemIds: string[];
}

export interface RoomMeta { id: string; anchor: Pt; name: string; floor: string }
export interface Measure { id: string; a: Pt; b: Pt }

export interface Settings { wallHeight: number; wallThickness: number; showCeiling: boolean }

export interface Project {
  version: 1;
  name: string;
  walls: Wall[];
  openings: Opening[];
  items: Item[];
  groups?: ItemGroup[];
  measures?: Measure[];
  roomMetas: RoomMeta[];
  settings: Settings;
}

export interface RoomPoly { poly: Pt[]; area: number; centroid: Pt; metaId?: string }

export type Selection =
  | { kind: 'wall'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'multi'; ids: string[] }
  | { kind: 'group'; id: string }
  | { kind: 'measure'; id: string }
  | { kind: 'room'; metaId: string };

export type Tool =
  | { type: 'select' }
  | { type: 'wall' }
  | { type: 'rect' }
  | { type: 'door' }
  | { type: 'window' }
  | { type: 'ruler' }
  | { type: 'measure' }
  | { type: 'boxSelect' }
  | { type: 'place'; defId: string };

export interface CtxMenu { x: number; y: number; sel: Selection }

export type ViewMode = '2d' | '3d';
export type Theme = 'dark' | 'light';

let seq = 0;
export const uid = (p: string) =>
  `${p}_${(++seq).toString(36)}${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;

export const defaultSettings = (): Settings => ({ wallHeight: 280, wallThickness: 20, showCeiling: false });

export const emptyProject = (name = '未命名方案'): Project => ({
  version: 1, name, walls: [], openings: [], items: [], groups: [], measures: [], roomMetas: [], settings: defaultSettings(),
});

import { HOME_DEFS, EXTRA_DEFS } from './defs';
import type { CatId, FurnDef } from './defs';

export type { CatId, FurnDef, FurnKind } from './defs';

export const CATALOG: FurnDef[] = [...HOME_DEFS, ...EXTRA_DEFS];

export const CATS: { id: CatId; name: string }[] = [
  { id: 'living', name: '客厅' },
  { id: 'bedroom', name: '卧室' },
  { id: 'dining', name: '餐厨' },
  { id: 'bath', name: '卫浴' },
  { id: 'seat', name: '桌椅' },
  { id: 'office', name: '办公' },
];

const defMap = new Map(CATALOG.map((d) => [d.id, d]));
export const defOf = (id: string): FurnDef => defMap.get(id) ?? CATALOG[0];

export type FloorType = 'wood' | 'tile' | 'marble' | 'carpet';
export interface FloorMat { id: string; name: string; type: FloorType; base: string; plan: string }

export const FLOORS: FloorMat[] = [
  { id: 'woodLight', name: '浅色木地板', type: 'wood', base: '#c8a87e', plan: '#ead9bf' },
  { id: 'woodDark', name: '深色木地板', type: 'wood', base: '#8d6845', plan: '#d4b896' },
  { id: 'tileGray', name: '灰色瓷砖', type: 'tile', base: '#aeb4b9', plan: '#dde0e3' },
  { id: 'tileBeige', name: '米色瓷砖', type: 'tile', base: '#cfc4ae', plan: '#ece5d4' },
  { id: 'marble', name: '大理石', type: 'marble', base: '#dcdcd8', plan: '#eff0ec' },
  { id: 'carpetGray', name: '灰色地毯', type: 'carpet', base: '#9aa0a8', plan: '#d6dade' },
  { id: 'carpetBlue', name: '蓝灰地毯', type: 'carpet', base: '#7e8ca0', plan: '#ccd5e0' },
];

const floorMap = new Map(FLOORS.map((f) => [f.id, f]));
export const floorOf = (id: string): FloorMat => floorMap.get(id) ?? FLOORS[0];

export const WALL_COLORS = ['#e8e4da', '#dfd6c6', '#cfd8dc', '#d9c8b8', '#c9d3c5', '#e3d2d2', '#b8c5d1', '#efe9dd'];

export const ITEM_COLORS = [
  '#7d93ab', '#a98f76', '#9a7b58', '#7e8c75', '#90a4be', '#b08e6a',
  '#5d8f62', '#aab6bf', '#4d5560', '#8b95a6', '#c0915f', '#e8eef2',
];

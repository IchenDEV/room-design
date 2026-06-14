import {
  BATH_DEFS, BEDROOM_DEFS, DINING_DEFS, EXTRA_DEFS, HOME_DEFS,
  LIVING_DEFS, OFFICE_DEFS, SEAT_DEFS,
} from './defs';
import type { CatId, FurnDef, FurnKind, FurnTexture } from './defs';

export type { CatId, FurnDef, FurnKind, FurnTexture } from './defs';

export const CATALOG: FurnDef[] = [
  ...HOME_DEFS, ...LIVING_DEFS, ...BEDROOM_DEFS, ...DINING_DEFS,
  ...BATH_DEFS, ...EXTRA_DEFS, ...SEAT_DEFS, ...OFFICE_DEFS,
];

export const CATS: { id: CatId; name: string }[] = [
  { id: 'living', name: '客厅' },
  { id: 'bedroom', name: '卧室' },
  { id: 'dining', name: '餐厨' },
  { id: 'bath', name: '卫浴' },
  { id: 'electric', name: '电气' },
  { id: 'seat', name: '桌椅' },
  { id: 'office', name: '办公' },
];

const defMap = new Map(CATALOG.map((d) => [d.id, d]));
export const defOf = (id: string): FurnDef => defMap.get(id) ?? CATALOG[0];

export const TEXTURES: { id: FurnTexture; name: string }[] = [
  { id: 'fabric', name: '织物' }, { id: 'leather', name: '皮革' },
  { id: 'wood', name: '木纹' }, { id: 'darkWood', name: '深木' },
  { id: 'metal', name: '金属' }, { id: 'glass', name: '玻璃' },
  { id: 'stone', name: '石材' }, { id: 'ceramic', name: '陶瓷' },
  { id: 'rattan', name: '藤编' }, { id: 'felt', name: '绒面' },
  { id: 'plastic', name: '塑料' }, { id: 'plant', name: '植栽' },
];

const byKind: Partial<Record<FurnKind, FurnTexture>> = {
  sofa: 'fabric', chair: 'fabric', stool: 'wood', barstool: 'leather', bench: 'wood',
  table: 'wood', roundtable: 'wood', bed: 'fabric', wardrobe: 'wood',
  nightstand: 'wood', dresser: 'wood', shelf: 'wood', tvstand: 'darkWood',
  counter: 'stone', fridge: 'metal', washer: 'metal', toilet: 'ceramic',
  bathsink: 'ceramic', bathtub: 'ceramic', shower: 'glass', rug: 'felt',
  lamp: 'metal', plant: 'plant', officedesk: 'wood', officechair: 'fabric',
  filecabinet: 'metal', whiteboard: 'glass', printer: 'plastic', partition: 'fabric',
  outlet: 'plastic', weakbox: 'metal', accesspanel: 'plastic',
};

export const defaultTexture = (def: FurnDef): FurnTexture => def.texture ?? byKind[def.kind] ?? 'wood';

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

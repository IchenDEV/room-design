/** 家具目录：尺寸单位 cm，kind 决定 2D 图例与 3D 模型构建方式 */

export type FurnKind =
  | 'sofa' | 'table' | 'tvstand' | 'shelf' | 'rug' | 'lamp' | 'plant'
  | 'bed' | 'wardrobe' | 'nightstand' | 'dresser' | 'chair'
  | 'counter' | 'fridge' | 'washer'
  | 'toilet' | 'bathsink' | 'bathtub' | 'shower';

export interface FurnDef {
  id: string;
  name: string;
  cat: 'living' | 'bed' | 'dine' | 'bath';
  w: number; d: number; h: number;
  color: string;
  kind: FurnKind;
  /** counter 的子类型 */
  sub?: 'plain' | 'stove' | 'sink';
}

export const CATS: { id: FurnDef['cat']; name: string }[] = [
  { id: 'living', name: '客厅' },
  { id: 'bed', name: '卧室' },
  { id: 'dine', name: '餐厨' },
  { id: 'bath', name: '卫浴' },
];

export const CATALOG: FurnDef[] = [
  // 客厅
  { id: 'sofa3', name: '三人沙发', cat: 'living', w: 220, d: 95, h: 82, color: '#7c8ea6', kind: 'sofa' },
  { id: 'sofa1', name: '单人沙发', cat: 'living', w: 98, d: 88, h: 82, color: '#9aa28e', kind: 'sofa' },
  { id: 'coffeeTable', name: '茶几', cat: 'living', w: 120, d: 60, h: 45, color: '#b08a5a', kind: 'table' },
  { id: 'tvStand', name: '电视柜', cat: 'living', w: 180, d: 42, h: 48, color: '#a98a62', kind: 'tvstand' },
  { id: 'bookshelf', name: '书柜', cat: 'living', w: 90, d: 32, h: 200, color: '#a9805a', kind: 'shelf' },
  { id: 'rug', name: '地毯', cat: 'living', w: 230, d: 160, h: 2, color: '#b9c7d4', kind: 'rug' },
  { id: 'floorLamp', name: '落地灯', cat: 'living', w: 36, d: 36, h: 162, color: '#d9c08a', kind: 'lamp' },
  { id: 'plant', name: '绿植', cat: 'living', w: 46, d: 46, h: 150, color: '#5f8f5a', kind: 'plant' },
  // 卧室
  { id: 'bedDouble', name: '双人床', cat: 'bed', w: 180, d: 212, h: 96, color: '#93a8c0', kind: 'bed' },
  { id: 'bedSingle', name: '单人床', cat: 'bed', w: 120, d: 202, h: 92, color: '#a5b3a0', kind: 'bed' },
  { id: 'wardrobe', name: '衣柜', cat: 'bed', w: 150, d: 60, h: 230, color: '#a98a62', kind: 'wardrobe' },
  { id: 'nightstand', name: '床头柜', cat: 'bed', w: 48, d: 40, h: 52, color: '#a98a62', kind: 'nightstand' },
  { id: 'dresser', name: '斗柜', cat: 'bed', w: 100, d: 45, h: 92, color: '#a98a62', kind: 'dresser' },
  { id: 'desk', name: '书桌', cat: 'bed', w: 130, d: 60, h: 76, color: '#b08a5a', kind: 'table' },
  { id: 'chair', name: '椅子', cat: 'bed', w: 46, d: 52, h: 86, color: '#6e5640', kind: 'chair' },
  // 餐厨
  { id: 'diningTable', name: '餐桌', cat: 'dine', w: 150, d: 85, h: 76, color: '#b08a5a', kind: 'table' },
  { id: 'diningChair', name: '餐椅', cat: 'dine', w: 45, d: 50, h: 92, color: '#6e5640', kind: 'chair' },
  { id: 'counter', name: '橱柜', cat: 'dine', w: 100, d: 62, h: 88, color: '#eef0ee', kind: 'counter', sub: 'plain' },
  { id: 'stove', name: '灶台柜', cat: 'dine', w: 80, d: 62, h: 88, color: '#eef0ee', kind: 'counter', sub: 'stove' },
  { id: 'kitchenSink', name: '水槽柜', cat: 'dine', w: 80, d: 62, h: 88, color: '#eef0ee', kind: 'counter', sub: 'sink' },
  { id: 'fridge', name: '冰箱', cat: 'dine', w: 65, d: 68, h: 186, color: '#dfe3e8', kind: 'fridge' },
  { id: 'washer', name: '洗衣机', cat: 'dine', w: 60, d: 60, h: 86, color: '#e8eaee', kind: 'washer' },
  // 卫浴
  { id: 'toilet', name: '马桶', cat: 'bath', w: 42, d: 72, h: 76, color: '#f2f4f6', kind: 'toilet' },
  { id: 'bathSink', name: '浴室柜', cat: 'bath', w: 65, d: 50, h: 86, color: '#b6a387', kind: 'bathsink' },
  { id: 'bathtub', name: '浴缸', cat: 'bath', w: 175, d: 82, h: 60, color: '#f2f4f6', kind: 'bathtub' },
  { id: 'shower', name: '淋浴房', cat: 'bath', w: 95, d: 95, h: 205, color: '#cfe0ea', kind: 'shower' },
];

const byId = new Map(CATALOG.map(d => [d.id, d]));
export const defOf = (id: string): FurnDef => byId.get(id) ?? CATALOG[0];

/** 地板材质 */
export interface FloorMat {
  id: string;
  name: string;
  /** 2D 平面填充色 */
  plan: string;
  kind: 'wood' | 'tile' | 'marble' | 'carpet';
  base: string;
}

export const FLOORS: FloorMat[] = [
  { id: 'woodLight', name: '原木地板', plan: '#ead9b9', kind: 'wood', base: '#c9a876' },
  { id: 'woodWarm', name: '柚木地板', plan: '#dfc49e', kind: 'wood', base: '#a87f52' },
  { id: 'tileGray', name: '灰色瓷砖', plan: '#dfe2e6', kind: 'tile', base: '#b9bec6' },
  { id: 'tileBeige', name: '米色瓷砖', plan: '#ece5d6', kind: 'tile', base: '#d8cdb9' },
  { id: 'marble', name: '大理石', plan: '#eceef0', kind: 'marble', base: '#e2e5e9' },
  { id: 'carpet', name: '灰青地毯', plan: '#d4dddf', kind: 'carpet', base: '#94a8ac' },
];

export const DEFAULT_FLOOR = 'woodLight';
const floorById = new Map(FLOORS.map(f => [f.id, f]));
export const floorOf = (id?: string): FloorMat => floorById.get(id ?? DEFAULT_FLOOR) ?? FLOORS[0];

/** 墙面颜色 / 家具颜色候选 */
export const WALL_COLORS = ['#f5f2ec', '#efe7d9', '#e6e9ee', '#d8e0e8', '#e3d5c3', '#dde6da'];
export const ITEM_COLORS = ['#7c8ea6', '#9aa28e', '#b08a5a', '#6e5640', '#8a99ad', '#a96f5a', '#5f8f5a', '#cfd4da', '#f2f4f6', '#3f4756'];

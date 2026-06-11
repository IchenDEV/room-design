// 家具种类：决定 2D 图例与 3D 模型的构建方式
export type FurnKind =
  | 'sofa' | 'chair' | 'table' | 'roundtable' | 'bed' | 'wardrobe' | 'nightstand' | 'dresser'
  | 'shelf' | 'tvstand' | 'counter' | 'fridge' | 'washer' | 'toilet' | 'bathsink' | 'bathtub'
  | 'shower' | 'rug' | 'lamp' | 'plant' | 'stool' | 'barstool' | 'bench'
  | 'officedesk' | 'officechair' | 'filecabinet' | 'whiteboard' | 'printer' | 'partition';

export type CatId = 'living' | 'bedroom' | 'dining' | 'bath' | 'seat' | 'office';

export interface FurnDef {
  id: string; name: string; cat: CatId; kind: FurnKind;
  w: number; d: number; h: number; color: string;
}

const D = (id: string, name: string, cat: CatId, kind: FurnKind, w: number, d: number, h: number, color: string): FurnDef =>
  ({ id, name, cat, kind, w, d, h, color });

export const HOME_DEFS: FurnDef[] = [
  // 客厅
  D('sofa3', '三人沙发', 'living', 'sofa', 220, 95, 80, '#7d93ab'),
  D('sofa1', '单人沙发', 'living', 'sofa', 95, 90, 78, '#a98f76'),
  D('coffee', '茶几', 'living', 'table', 120, 60, 45, '#9a7b58'),
  D('tvstand', '电视柜', 'living', 'tvstand', 180, 45, 50, '#6b5740'),
  D('rug', '地毯', 'living', 'rug', 200, 140, 2, '#b9a48c'),
  D('lamp', '落地灯', 'living', 'lamp', 40, 40, 165, '#d8c8a8'),
  D('plant', '绿植', 'living', 'plant', 45, 45, 140, '#5d8f62'),
  D('shelf', '置物架', 'living', 'shelf', 100, 32, 200, '#8a7257'),
  // 卧室
  D('bedD', '双人床', 'bedroom', 'bed', 180, 210, 45, '#90a4be'),
  D('bedS', '单人床', 'bedroom', 'bed', 120, 200, 45, '#a9b8a2'),
  D('nstand', '床头柜', 'bedroom', 'nightstand', 45, 40, 55, '#9a7e5d'),
  D('wardrobe', '衣柜', 'bedroom', 'wardrobe', 200, 60, 240, '#8d6f4f'),
  D('dresser', '梳妆台', 'bedroom', 'dresser', 100, 45, 76, '#b08e6a'),
  // 餐厨
  D('dtable', '餐桌', 'dining', 'table', 160, 90, 75, '#8f6c48'),
  D('dchair', '餐椅', 'dining', 'chair', 46, 50, 90, '#7e8c75'),
  D('counter', '橱柜台面', 'dining', 'counter', 240, 62, 86, '#9aa3ad'),
  D('fridge', '冰箱', 'dining', 'fridge', 70, 70, 180, '#aab6bf'),
  D('washer', '洗衣机', 'dining', 'washer', 60, 60, 85, '#b8c0c7'),
  // 卫浴
  D('toilet', '马桶', 'bath', 'toilet', 42, 70, 75, '#e8eef2'),
  D('bsink', '浴室柜', 'bath', 'bathsink', 80, 52, 85, '#cdd8de'),
  D('btub', '浴缸', 'bath', 'bathtub', 170, 80, 58, '#dfe9ee'),
  D('shower', '淋浴房', 'bath', 'shower', 90, 90, 200, '#c2d4dc'),
];

export const EXTRA_DEFS: FurnDef[] = [
  // 桌椅板凳
  D('stool', '方凳', 'seat', 'stool', 38, 38, 45, '#c0915f'),
  D('barstool', '吧台凳', 'seat', 'barstool', 42, 42, 78, '#7a6a55'),
  D('bench', '长条凳', 'seat', 'bench', 120, 38, 46, '#a5814f'),
  D('rtable', '圆桌', 'seat', 'roundtable', 100, 100, 75, '#96755a'),
  D('sqtable', '方桌', 'seat', 'table', 80, 80, 76, '#8d7050'),
  D('armchair', '扶手椅', 'seat', 'sofa', 92, 88, 80, '#7f8e6f'),
  // 办公
  D('odesk', '办公桌', 'office', 'officedesk', 140, 70, 75, '#d7c9b4'),
  D('ochair', '办公椅', 'office', 'officechair', 62, 62, 98, '#4d5560'),
  D('mtable', '会议桌', 'office', 'table', 260, 120, 75, '#6f5a43'),
  D('fcab', '文件柜', 'office', 'filecabinet', 90, 45, 180, '#9aa1a8'),
  D('wboard', '白板', 'office', 'whiteboard', 140, 12, 186, '#eef1f3'),
  D('printer', '打印机', 'office', 'printer', 55, 60, 100, '#b6bcc2'),
  D('partition', '隔断屏风', 'office', 'partition', 140, 8, 150, '#8b95a6'),
];

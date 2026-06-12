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

export const D = (id: string, name: string, cat: CatId, kind: FurnKind, w: number, d: number, h: number, color: string): FurnDef =>
  ({ id, name, cat, kind, w, d, h, color });

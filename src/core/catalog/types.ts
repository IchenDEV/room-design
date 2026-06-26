// 家具种类：决定 2D 图例与 3D 模型的构建方式
export type FurnKind =
  | 'sofa' | 'chair' | 'table' | 'roundtable' | 'bed' | 'wardrobe' | 'nightstand' | 'dresser'
  | 'shelf' | 'tvstand' | 'counter' | 'fridge' | 'waterdispenser' | 'washer' | 'toilet' | 'bathsink' | 'bathtub'
  | 'shower' | 'rug' | 'lamp' | 'plant' | 'stool' | 'barstool' | 'bench'
  | 'officedesk' | 'officechair' | 'filecabinet' | 'whiteboard' | 'printer' | 'partition'
  | 'outlet' | 'weakbox' | 'accesspanel';

export type CatId = 'living' | 'bedroom' | 'dining' | 'bath' | 'electric' | 'seat' | 'office' | 'decor';
export type FurnTexture =
  | 'fabric' | 'leather' | 'wood' | 'darkWood' | 'metal' | 'glass'
  | 'stone' | 'ceramic' | 'rattan' | 'felt' | 'plastic' | 'plant';

export interface FurnDef {
  id: string; name: string; cat: CatId; kind: FurnKind;
  w: number; d: number; h: number; color: string;
  texture?: FurnTexture; surfaceZ?: number;
}

export const D = (
  id: string, name: string, cat: CatId, kind: FurnKind,
  w: number, d: number, h: number, color: string, texture?: FurnTexture,
  surfaceZ?: number,
): FurnDef => ({ id, name, cat, kind, w, d, h, color, texture, surfaceZ });

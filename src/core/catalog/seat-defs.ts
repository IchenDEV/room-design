import { D, type FurnDef } from './types';

export const SEAT_DEFS: FurnDef[] = [
  D('chair-lounge-low', '低休闲椅', 'seat', 'chair', 72, 78, 78, '#8b7b68', 'fabric'),
  D('chair-lounge-high', '高背休闲椅', 'seat', 'chair', 75, 82, 105, '#7d8a74', 'fabric'),
  D('chair-rocking', '摇椅', 'seat', 'chair', 70, 90, 95, '#9b7d55', 'wood'),
  D('chair-folding', '折叠椅', 'seat', 'chair', 46, 50, 82, '#7d858c', 'metal'),
  D('chair-cane', '藤编椅', 'seat', 'chair', 55, 58, 86, '#b18b5d', 'rattan'),
  D('chair-leather', '皮革扶手椅', 'seat', 'chair', 68, 72, 86, '#7a5a45', 'leather'),
  D('chair-plastic', '塑料椅', 'seat', 'chair', 48, 52, 82, '#9aa7b1', 'plastic'),
  D('stool-round', '圆凳', 'seat', 'stool', 38, 38, 45, '#c0915f', 'wood'),
  D('stool-upholstered', '软包凳', 'seat', 'stool', 45, 45, 45, '#9d7d70', 'fabric'),
  D('stool-ceramic', '陶瓷鼓凳', 'seat', 'stool', 38, 38, 46, '#c9d6da', 'ceramic'),
  D('barstool-back', '带背吧椅', 'seat', 'barstool', 45, 48, 95, '#7a6a55', 'leather'),
  D('barstool-metal', '金属吧椅', 'seat', 'barstool', 42, 42, 76, '#8a9198', 'metal'),
  D('bench-padded', '软包长凳', 'seat', 'bench', 140, 45, 48, '#9c8171', 'fabric'),
  D('bench-cane', '藤编长凳', 'seat', 'bench', 130, 42, 46, '#b18b5d', 'rattan'),
  D('bench-outdoor', '户外长椅', 'seat', 'bench', 160, 55, 82, '#8a6f4f', 'wood'),
  D('table-side-round', '圆边桌', 'seat', 'roundtable', 55, 55, 55, '#9b7855', 'wood'),
  D('table-side-square', '方边桌', 'seat', 'table', 55, 45, 55, '#8d7050', 'wood'),
  D('table-console-narrow', '窄边台', 'seat', 'table', 120, 32, 78, '#8f7358', 'wood'),
  D('nesting-tables', '套几', 'seat', 'table', 95, 55, 48, '#a58460', 'wood'),
  D('tea-table-low', '矮茶桌', 'seat', 'table', 100, 60, 36, '#8d6d4f', 'wood'),
];

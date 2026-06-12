import { D, type FurnDef } from './types';

export const EXTRA_DEFS: FurnDef[] = [
  D('stool', '方凳', 'seat', 'stool', 38, 38, 45, '#c0915f', 'wood'),
  D('barstool', '吧台凳', 'seat', 'barstool', 42, 42, 78, '#7a6a55', 'leather'),
  D('bench', '长条凳', 'seat', 'bench', 120, 38, 46, '#a5814f', 'wood'),
  D('rtable', '圆桌', 'seat', 'roundtable', 100, 100, 75, '#96755a', 'wood'),
  D('sqtable', '方桌', 'seat', 'table', 80, 80, 76, '#8d7050', 'wood'),
  D('armchair', '扶手椅', 'seat', 'sofa', 92, 88, 80, '#7f8e6f', 'fabric'),
];

import { D, type FurnDef } from './types';

export const HOME_DEFS: FurnDef[] = [
  // 客厅
  D('sofa3', '三人沙发', 'living', 'sofa', 220, 95, 80, '#7d93ab', 'fabric'),
  D('sofa1', '单人沙发', 'living', 'sofa', 95, 90, 78, '#a98f76', 'fabric'),
  D('coffee', '茶几', 'living', 'table', 120, 60, 45, '#9a7b58', 'wood'),
  D('tvstand', '电视柜', 'living', 'tvstand', 180, 45, 50, '#6b5740', 'darkWood'),
  D('rug', '地毯', 'living', 'rug', 200, 140, 2, '#b9a48c', 'felt'),
  D('lamp', '落地灯', 'living', 'lamp', 40, 40, 165, '#d8c8a8', 'metal'),
  D('plant', '绿植', 'living', 'plant', 45, 45, 140, '#5d8f62', 'plant'),
  D('shelf', '置物架', 'living', 'shelf', 100, 32, 200, '#8a7257', 'wood'),
  // 卧室
  D('bedD', '双人床', 'bedroom', 'bed', 180, 210, 45, '#90a4be', 'fabric'),
  D('bedS', '单人床', 'bedroom', 'bed', 120, 200, 45, '#a9b8a2', 'fabric'),
  D('nstand', '床头柜', 'bedroom', 'nightstand', 45, 40, 55, '#9a7e5d', 'wood'),
  D('wardrobe', '衣柜', 'bedroom', 'wardrobe', 200, 60, 240, '#8d6f4f', 'wood'),
  D('dresser', '梳妆台', 'bedroom', 'dresser', 100, 45, 76, '#b08e6a', 'wood'),
  // 餐厨
  D('dtable', '餐桌', 'dining', 'table', 160, 90, 75, '#8f6c48', 'wood'),
  D('dchair', '餐椅', 'dining', 'chair', 46, 50, 90, '#7e8c75', 'fabric'),
  D('counter', '橱柜台面', 'dining', 'counter', 240, 62, 86, '#9aa3ad', 'stone'),
  D('fridge', '冰箱', 'dining', 'fridge', 70, 70, 180, '#aab6bf', 'metal'),
  D('washer', '洗衣机', 'dining', 'washer', 60, 60, 85, '#b8c0c7', 'metal'),
  // 卫浴
  D('toilet', '马桶', 'bath', 'toilet', 42, 70, 75, '#e8eef2', 'ceramic'),
  D('bsink', '浴室柜', 'bath', 'bathsink', 80, 52, 85, '#cdd8de', 'ceramic'),
  D('btub', '浴缸', 'bath', 'bathtub', 170, 80, 58, '#dfe9ee', 'ceramic'),
  D('shower', '淋浴房', 'bath', 'shower', 90, 90, 200, '#c2d4dc', 'glass'),
];

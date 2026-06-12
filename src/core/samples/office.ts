import type { Project } from '../types';
import { mkWall, mkDoor, mkWin, mkItem, mkMeta, mkProject } from './util';

/** 示例：现代办公室 · 约 112㎡（玻璃会议室 + 经理室） */
export function makeOffice(): Project {
  const w = [
    mkWall(0, 0, 1400, 0, 24),            // 0 南外墙
    mkWall(1400, 0, 1400, 800, 24),       // 1 东外墙
    mkWall(1400, 800, 0, 800, 24),        // 2 北外墙
    mkWall(0, 800, 0, 0, 24),             // 3 西外墙
    mkWall(980, 500, 980, 800, 8, 'glass'),     // 4 会议室玻璃墙(西)
    mkWall(980, 500, 1400, 500, 8, 'glass'),    // 5 会议室玻璃墙(南)
    mkWall(1080, 0, 1080, 300, 12),       // 6 经理室西隔墙
    mkWall(1080, 300, 1400, 300, 8, 'glass'),   // 7 经理室玻璃墙(北)
    mkWall(320, 560, 320, 800, 12),       // 8 茶水间东隔墙
    mkWall(0, 560, 320, 560, 12),         // 9 茶水间南隔墙
  ];
  const o = [
    mkDoor(w[0], 0.385, 160, { style: 'glass', swing: 'double' }), // 入口玻璃双开门
    mkDoor(w[5], 0.19, 100, { style: 'glass' }),    // 会议室玻璃门
    mkDoor(w[7], 0.2, 95, { style: 'glass' }),      // 经理室玻璃门
    mkDoor(w[8], 0.46, 100),                        // 茶水间门
    mkWin(w[2], 0.64, 260), mkWin(w[2], 0.18, 220),
    mkWin(w[1], 0.25, 180), mkWin(w[1], 0.8, 200),
    mkWin(w[3], 0.62, 220), mkWin(w[0], 0.11, 200), mkWin(w[0], 0.64, 200),
  ];
  const desks = [420, 600, 780].flatMap((x) => [
    mkItem('odesk', x, 380, 0), mkItem('ochair', x, 318, 180),
    mkItem('odesk', x, 470, 180), mkItem('ochair', x, 532, 0),
  ]);
  const items = [
    ...desks,
    mkItem('partition', 925, 425, 90),
    // 前台接待
    mkItem('sofa3', 225, 95, 0), mkItem('coffee', 225, 185, 0), mkItem('rug', 225, 150, 0),
    mkItem('plant', 58, 62), mkItem('whiteboard', 1062, 152, 270),
    // 会议室
    mkItem('mtable', 1190, 655, 0),
    mkItem('ochair', 1110, 582, 180), mkItem('ochair', 1190, 582, 180), mkItem('ochair', 1270, 582, 180),
    mkItem('ochair', 1110, 728, 0), mkItem('ochair', 1190, 728, 0), mkItem('ochair', 1270, 728, 0),
    mkItem('wboard', 1382, 655, 270), mkItem('plant', 1005, 772),
    // 经理室
    mkItem('odesk', 1240, 195, 0), mkItem('ochair', 1240, 258, 180),
    mkItem('fcab', 1368, 85, 270), mkItem('sofa1', 1135, 65, 90), mkItem('plant', 1368, 262),
    // 茶水间
    mkItem('counter', 160, 762, 180), mkItem('fridge', 278, 648, 270),
    mkItem('rtable', 150, 645), mkItem('stool', 95, 645, 90), mkItem('stool', 205, 645, 270),
    mkItem('stool', 150, 588, 180),
    // 公共区
    mkItem('fcab', 42, 300, 90), mkItem('fcab', 42, 392, 90), mkItem('printer', 45, 478, 90),
    mkItem('plant', 360, 760), mkItem('plant', 945, 62),
  ];
  const metas = [
    mkMeta('开放办公区', 650, 400, 'carpetGray'), mkMeta('会议室', 1190, 650, 'carpetBlue'),
    mkMeta('经理室', 1240, 150, 'woodDark'), mkMeta('茶水间', 160, 680, 'tileGray'),
  ];
  return mkProject('现代办公室 112㎡', w, o, items, metas);
}

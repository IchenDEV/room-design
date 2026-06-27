import type { Project } from '../types';
import { mkWall, mkDoor, mkWin, mkItem, mkMeta, mkProject } from './util';

/** 示例：开放一居 LOFT · 约 40㎡（玻璃隔断卧室） */
export function makeHomeB(): Project {
  const w = [
    mkWall(0, 0, 720, 0, 24),           // 0 南外墙
    mkWall(720, 0, 720, 560, 24),       // 1 东外墙
    mkWall(720, 560, 0, 560, 24),       // 2 北外墙
    mkWall(0, 560, 0, 0, 24),           // 3 西外墙
    mkWall(430, 250, 430, 560, 8, 'glass'),   // 4 卧室玻璃隔断(西)
    mkWall(430, 250, 720, 250, 8, 'glass'),   // 5 卧室玻璃隔断(南)
    mkWall(220, 360, 220, 560, 10),     // 6 卫生间东隔墙
    mkWall(0, 360, 220, 360, 10),       // 7 卫生间南隔墙
  ];
  const o = [
    mkDoor(w[0], 0.47, 100),                      // 入户门
    mkDoor(w[5], 0.25, 95, { style: 'glass' }),   // 卧室玻璃门
    mkDoor(w[6], 0.5, 80),                        // 卫生间门
    mkWin(w[2], 0.2, 180), mkWin(w[2], 0.82, 90, { sill: 140, h: 100 }),
    mkWin(w[1], 0.28, 150), mkWin(w[0], 0.16, 200), mkWin(w[3], 0.73, 160),
  ];
  const items = [
    // 卧室（玻璃隔断内）
    mkItem('bedD', 565, 430, 0), mkItem('nstand', 455, 525), mkItem('nstand', 682, 525),
    mkItem('wardrobe', 688, 380, 270),
    // 卫生间
    mkItem('toilet', 52, 518, 180), mkItem('bsink', 165, 525, 180),
    mkItem('shower', 58, 412), mkItem('washer', 178, 405, 90),
    // 起居 + 餐厨（开放）
    mkItem('counter', 170, 58, 180), mkItem('fridge', 350, 62, 180),
    mkItem('barstool', 120, 145), mkItem('barstool', 225, 145),
    mkItem('sofa1', 330, 452, 90), mkItem('tvstand', 245, 460, 90), mkItem('rug', 320, 455, 90),
    mkItem('dtable-round-4', 570, 145), mkItem('dchair', 465, 145, 90), mkItem('dchair', 675, 145, 270),
    mkItem('bench', 570, 58, 0), mkItem('lamp', 688, 48), mkItem('plant', 688, 212),
    mkItem('shelf', 60, 250, 90), mkItem('plant', 395, 530),
  ];
  const metas = [
    mkMeta('卧室', 575, 400, 'woodLight'),
    mkMeta('卫生间', 110, 460, 'tileGray'),
    mkMeta('起居·餐厨', 300, 180, 'woodDark'),
  ];
  return mkProject('开放一居 LOFT 40㎡', w, o, items, metas);
}

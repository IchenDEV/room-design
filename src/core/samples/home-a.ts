import type { Project } from '../types';
import { mkWall, mkDoor, mkWin, mkItem, mkMeta, mkProject } from './util';

/** 示例：温馨两居 · 约 74㎡ */
export function makeHomeA(): Project {
  const w = [
    mkWall(0, 0, 1060, 0, 24),          // 0 南外墙
    mkWall(1060, 0, 1060, 700, 24),     // 1 东外墙
    mkWall(1060, 700, 0, 700, 24),      // 2 北外墙
    mkWall(0, 700, 0, 0, 24),           // 3 西外墙
    mkWall(380, 0, 380, 700, 12),       // 4 中部纵隔墙
    mkWall(0, 420, 380, 420, 12),       // 5 主卧南隔墙
    mkWall(0, 260, 380, 260, 12),       // 6 次卧北隔墙
    mkWall(200, 260, 200, 420, 10),     // 7 卫生间隔墙
    mkWall(380, 520, 700, 520, 12),     // 8 厨房南隔墙
    mkWall(700, 520, 700, 700, 12),     // 9 厨房东隔墙
  ];
  const o = [
    mkDoor(w[0], 0.77, 100),                       // 入户门
    mkDoor(w[4], 0.80, 95, { flip: true }),        // 主卧门
    mkDoor(w[4], 0.243, 90),                       // 次卧门
    mkDoor(w[4], 0.486, 100),                      // 走廊门
    mkDoor(w[7], 0.5, 80),                         // 卫生间门
    mkDoor(w[8], 0.4, 140, { style: 'glass' }),    // 厨房玻璃推拉门
    mkWin(w[2], 0.83, 160), mkWin(w[2], 0.34, 220),
    mkWin(w[0], 0.17, 160), mkWin(w[1], 0.5, 240),
    mkWin(w[3], 0.514, 60, { sill: 130, h: 100 }),
  ];
  const items = [
    // 主卧
    mkItem('bedD', 145, 585, 180), mkItem('nstand', 28, 665), mkItem('nstand', 262, 665),
    mkItem('wardrobe', 344, 560, 90), mkItem('dresser', 250, 445, 0),
    // 次卧
    mkItem('bedS', 105, 150, 90), mkItem('wardrobe', 265, 50, 0),
    mkItem('dresser', 310, 205, 0), mkItem('vanity-stool', 235, 205, 0), mkItem('plant', 35, 35),
    // 卫生间
    mkItem('toilet', 52, 378, 180), mkItem('bsink', 140, 292, 0), mkItem('shower', 150, 368),
    // 走廊
    mkItem('plant', 350, 292),
    // 厨房
    mkItem('counter', 520, 662, 180), mkItem('fridge', 655, 575, 90),
    // 客厅·餐厅
    mkItem('tvstand', 1022, 180, 270), mkItem('sofa3', 790, 180, 90), mkItem('coffee', 905, 180, 90),
    mkItem('rug', 900, 180, 90), mkItem('lamp', 720, 82), mkItem('shelf', 398, 105, 90),
    mkItem('dtable', 560, 310, 90), mkItem('dchair', 455, 270, 90), mkItem('dchair', 455, 350, 90),
    mkItem('dchair', 665, 270, 270), mkItem('dchair', 665, 350, 270),
    mkItem('rtable', 895, 605), mkItem('armchair', 805, 605, 90), mkItem('stool', 975, 605, 270),
    mkItem('plant', 1028, 470), mkItem('plant', 1028, 660),
  ];
  const metas = [
    mkMeta('主卧', 180, 560, 'woodLight'), mkMeta('次卧', 190, 130, 'woodLight'),
    mkMeta('卫生间', 100, 340, 'tileGray'), mkMeta('走廊', 290, 340, 'woodLight'),
    mkMeta('厨房', 540, 610, 'tileBeige'), mkMeta('客厅·餐厅', 720, 300, 'woodDark'),
  ];
  return mkProject('温馨两居 74㎡', w, o, items, metas);
}

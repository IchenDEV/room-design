import type { Project, Wall, Opening, Item, RoomMeta } from './types';
import { defaultSettings } from './types';
import { defOf } from './catalog';

/** 示例工程：约 70m² 两居室（坐标单位 cm，墙体为中心线） */
export function makeSample(): Project {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;

  const W = (ax: number, ay: number, bx: number, by: number, thickness = 24): Wall =>
    ({ id: id('w'), ax, ay, bx, by, thickness, height: 280 });

  const walls: Wall[] = [
    // 外墙
    W(0, 0, 1000, 0),
    W(1000, 0, 1000, 700),
    W(1000, 700, 0, 700),
    W(0, 700, 0, 0),
    // 内墙
    W(600, 0, 600, 700, 12),     // 客厅与右侧功能区隔墙
    W(600, 350, 1000, 350, 12),  // 主卧 / 卫生间
    W(600, 500, 1000, 500, 12),  // 卫生间 / 厨房
    W(0, 400, 350, 400, 12),     // 次卧南墙
    W(350, 400, 350, 700, 12),   // 次卧东墙
  ];
  const [, wEast, wNorth, wWest, wMid, , , , wBed2E] = walls;
  const wSouth = walls[0];

  const O = (wallId: string, kind: 'door' | 'window', t: number, width: number, height: number, sill = 0): Opening =>
    ({ id: id('o'), wallId, kind, t, width, height, sill });

  const openings: Opening[] = [
    O(wSouth.id, 'door', 0.47, 100, 210),            // 入户门
    O(wMid.id, 'door', 290 / 700, 90, 210),          // 主卧门
    O(wMid.id, 'door', 425 / 700, 80, 205),          // 卫生间门
    O(wMid.id, 'door', 600 / 700, 120, 210),         // 厨房门洞
    O(wBed2E.id, 'door', 70 / 300, 90, 210),         // 次卧门
    O(wWest.id, 'window', 0.643, 240, 150, 90),      // 客厅西窗
    O(wWest.id, 'window', 0.2, 160, 150, 90),        // 次卧西窗
    O(wEast.id, 'window', 0.243, 200, 150, 90),      // 主卧东窗
    O(wEast.id, 'window', 0.607, 70, 100, 130),      // 卫生间高窗
    O(wEast.id, 'window', 0.857, 120, 140, 100),     // 厨房窗
    O(wNorth.id, 'window', 0.825, 180, 150, 90),     // 次卧北窗
    O(wNorth.id, 'window', 0.525, 140, 150, 90),     // 客厅北窗
  ];

  const I = (defId: string, x: number, y: number, rot = 0, color?: string): Item => {
    const def = defOf(defId);
    return { id: id('i'), defId, x, y, rot, w: def.w, d: def.d, h: def.h, color };
  };

  const items: Item[] = [
    // 客厅（沙发背靠西墙朝东）
    I('rug', 230, 235, 0),
    I('sofa3', 62, 235, 90),
    I('coffeeTable', 215, 235, 90),
    I('tvStand', 570, 235, -90),
    I('plant', 52, 56, 0),
    I('floorLamp', 60, 380, 0),
    I('bookshelf', 420, 670, 0),
    I('plant', 565, 660, 0),
    // 餐区
    I('diningTable', 440, 560, 90),
    I('diningChair', 378, 528, 90),
    I('diningChair', 378, 596, 90),
    I('diningChair', 502, 528, -90),
    I('diningChair', 502, 596, -90),
    // 主卧
    I('bedDouble', 800, 232, 0),
    I('nightstand', 683, 320, 0),
    I('nightstand', 917, 320, 0),
    I('wardrobe', 730, 44, 180),
    I('dresser', 962, 110, -90),
    // 次卧
    I('bedSingle', 110, 586, 0),
    I('nightstand', 205, 662, 0),
    I('wardrobe', 252, 437, 180),
    I('desk', 48, 480, 90, '#a98a62'),
    I('chair', 100, 480, -90),
    // 卫生间
    I('toilet', 652, 396, 180),
    I('bathSink', 682, 464, 0),
    I('shower', 940, 440, 0),
    I('washer', 790, 460, 0),
    // 厨房
    I('counter', 662, 660, 0),
    I('stove', 752, 660, 0),
    I('kitchenSink', 832, 660, 0),
    I('fridge', 952, 600, -90),
  ];

  const M = (x: number, y: number, name: string, floor: string): RoomMeta =>
    ({ id: id('m'), anchor: { x, y }, name, floor });

  const roomMetas: RoomMeta[] = [
    M(300, 250, '客厅·餐厅', 'woodLight'),
    M(800, 170, '主卧', 'woodWarm'),
    M(175, 550, '次卧', 'woodLight'),
    M(800, 425, '卫生间', 'tileGray'),
    M(800, 600, '厨房', 'tileBeige'),
  ];

  return { version: 1, walls, openings, items, roomMetas, settings: defaultSettings() };
}

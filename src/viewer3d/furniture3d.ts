import * as THREE from 'three';
import type { Item } from '../core/types';
import type { FurnDef, FurnKind } from '../core/catalog';
import { defOf } from '../core/catalog';
import { shade } from '../core/geometry';

/**
 * 程序化家具模型。
 * 局部坐标：x 宽度方向，y 向上，z 深度方向；正面朝 +z，背面（靠墙侧）朝 -z。
 */

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.85, metal = 0, opacity = 1): THREE.MeshStandardMaterial {
  const key = `${color}|${rough}|${metal}|${opacity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    if (opacity < 1) { m.transparent = true; m.opacity = opacity; }
    matCache.set(key, m);
  }
  return m;
}

const WOOD = '#a08562';
const WOOD_DARK = '#6e5640';
const WHITE = '#f4f4f1';
const CHROME = '#c4cad1';
const DARKGLASS = '#20242b';

function box(g: THREE.Group, m: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(g: THREE.Group, m: THREE.Material, rt: number, rb: number, h: number, x = 0, y = 0, z = 0, seg = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function sphere(g: THREE.Group, m: THREE.Material, r: number, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function legs4(g: THREE.Group, m: THREE.Material, w: number, d: number, h: number, inset = 7, size = 4.5) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, m, size, h, size, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset));
  }
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Builder = (g: THREE.Group, w: number, d: number, h: number, color: string, def: FurnDef) => void;

const builders: Record<FurnKind, Builder> = {
  sofa(g, w, d, h, color) {
    const fabric = mat(color, 0.95);
    const fabricDark = mat(shade(color, -16), 0.95);
    legs4(g, mat(WOOD_DARK, 0.6), w - 6, d - 6, 10, 6, 5);
    box(g, fabric, w - 4, 26, d - 10, 0, 10 + 13, 3);                       // 底座
    box(g, fabricDark, w, h - 40, 16, 0, 40 + (h - 40) / 2, -d / 2 + 8);    // 靠背
    for (const s of [-1, 1]) box(g, fabricDark, 14, h - 22, d, s * (w / 2 - 7), (h - 22) / 2 + 8, 0);
    const seats = w > 170 ? 3 : w > 110 ? 2 : 1;
    const sw = (w - 32) / seats;
    for (let i = 0; i < seats; i++) {
      box(g, fabric, sw - 5, 14, d - 38, -w / 2 + 16 + sw * (i + 0.5), 36 + 7, 8);   // 坐垫
      box(g, fabric, sw - 7, h - 58, 12, -w / 2 + 16 + sw * (i + 0.5), 52 + (h - 58) / 2, -d / 2 + 20); // 靠枕
    }
  },

  bed(g, w, d, h, color) {
    const frame = mat(WOOD, 0.7);
    box(g, frame, w, 26, d, 0, 13, 0);
    box(g, frame, w, h - 26, 8, 0, 26 + (h - 26) / 2, -d / 2 + 4);          // 床头板
    box(g, mat('#f2efe6', 0.9), w - 10, 17, d - 24, 0, 26 + 8.5, 5);        // 床垫
    box(g, mat(color, 0.95), w - 6, 7, d * 0.56, 0, 46, d / 2 - d * 0.28 - 5); // 被子
    const pil = mat('#ffffff', 0.9);
    if (w >= 150) {
      box(g, pil, w / 2 - 26, 9, 36, -w / 4 + 2, 47, -d / 2 + 36);
      box(g, pil, w / 2 - 26, 9, 36, w / 4 - 2, 47, -d / 2 + 36);
    } else {
      box(g, pil, w - 46, 9, 36, 0, 47, -d / 2 + 36);
    }
  },

  wardrobe(g, w, d, h, color) {
    const body = mat(color, 0.62);
    box(g, body, w, h, d, 0, h / 2, 0);
    box(g, mat(shade(color, -56), 0.6), 1.2, h - 12, 1, 0, h / 2, d / 2 + 0.4);   // 门缝
    const handle = mat(CHROME, 0.3, 0.85);
    for (const s of [-1, 1]) cyl(g, handle, 0.9, 0.9, 16, s * 7, h * 0.52, d / 2 + 1.6, 10);
    box(g, mat(shade(color, -22), 0.62), w, 5, d, 0, h - 2.5, 0);                  // 顶线
  },

  nightstand(g, w, d, h, color) {
    const body = mat(color, 0.62);
    box(g, body, w, h - 10, d, 0, (h - 10) / 2 + 10, 0);
    legs4(g, mat(WOOD_DARK, 0.6), w - 4, d - 4, 10, 4, 3.5);
    box(g, mat(shade(color, 14), 0.62), w - 8, (h - 10) * 0.42, 1.5, 0, h * 0.62, d / 2 + 0.6);
    sphere(g, mat(CHROME, 0.3, 0.8), 1.8, 0, h * 0.62, d / 2 + 2.4);
  },

  dresser(g, w, d, h, color) {
    const body = mat(color, 0.62);
    box(g, body, w, h - 8, d, 0, (h - 8) / 2 + 8, 0);
    legs4(g, mat(WOOD_DARK, 0.6), w - 6, d - 6, 8, 5, 4);
    const front = mat(shade(color, 12), 0.62);
    const rows = 3;
    for (let i = 0; i < rows; i++) {
      const fh = (h - 18) / rows - 4;
      const fy = 12 + ((h - 18) / rows) * (i + 0.5);
      box(g, front, w - 10, fh, 1.5, 0, fy, d / 2 + 0.6);
      sphere(g, mat(CHROME, 0.3, 0.8), 1.6, 0, fy, d / 2 + 2);
    }
  },

  table(g, w, d, h, color) {
    const wood = mat(color, 0.55);
    box(g, wood, w, 4.5, d, 0, h - 2.25, 0);
    legs4(g, mat(shade(color, -30), 0.6), w, d, h - 4.5, 7, 5.5);
  },

  chair(g, w, d, h, color) {
    const wood = mat(color, 0.6);
    const seatY = h * 0.5;
    box(g, wood, w, 4, d - 4, 0, seatY, 1);
    legs4(g, mat(shade(color, -24), 0.6), w - 4, d - 6, seatY, 3, 3.4);
    box(g, wood, w - 4, h - seatY - 2, 3.5, 0, seatY + (h - seatY) / 2, -d / 2 + 3);
  },

  tvstand(g, w, d, h, color) {
    const body = mat(color, 0.6);
    box(g, body, w, h - 8, d, 0, (h - 8) / 2 + 8, 0);
    legs4(g, mat(WOOD_DARK, 0.6), w - 8, d - 6, 8, 6, 4);
    box(g, mat(shade(color, 12), 0.6), w * 0.46, (h - 8) * 0.5, 1.5, -w * 0.24, h * 0.52, d / 2 + 0.5);
    box(g, mat(shade(color, 12), 0.6), w * 0.46, (h - 8) * 0.5, 1.5, w * 0.24, h * 0.52, d / 2 + 0.5);
    // 电视
    const tvW = Math.min(w * 0.72, 145);
    const tvH = tvW * 0.56;
    box(g, mat('#0e1116', 0.3), tvW, tvH, 3, 0, h + 12 + tvH / 2, -d * 0.12);
    box(g, mat('#262c35', 0.5), tvW * 0.22, 12, 14, 0, h + 6, -d * 0.12);
    const screen = new THREE.MeshStandardMaterial({ color: '#11151d', roughness: 0.12, metalness: 0.3, emissive: '#0a0f18', emissiveIntensity: 0.6 });
    box(g, screen, tvW - 6, tvH - 6, 0.8, 0, h + 12 + tvH / 2, -d * 0.12 + 1.8);
  },

  shelf(g, w, d, h, color) {
    const wood = mat(color, 0.62);
    for (const s of [-1, 1]) box(g, wood, 3, h, d, s * (w / 2 - 1.5), h / 2, 0);
    box(g, wood, w, h, 2, 0, h / 2, -d / 2 + 1);
    const rnd = mulberry32(7);
    const shelves = 5;
    for (let i = 0; i <= shelves; i++) {
      const y = 3 + (h - 6) * (i / shelves);
      box(g, wood, w - 6, 2.6, d - 3, 0, y, 0.5);
      if (i < shelves) {
        // 摆几本书
        let bx = -w / 2 + 9;
        const palette = ['#a45a52', '#54708e', '#6e8a5e', '#c2a05a', '#7a6a8a', '#9c7b5a'];
        while (bx < w / 2 - 14) {
          const bw = 3 + rnd() * 4;
          const bh = 14 + rnd() * 9;
          if (rnd() > 0.25) box(g, mat(palette[Math.floor(rnd() * palette.length)], 0.9), bw, bh, d - 12, bx + bw / 2, y + 1.3 + bh / 2, 0);
          bx += bw + 1.2;
        }
      }
    }
  },

  rug(g, w, d, _h, color) {
    const m1 = box(g, mat(color, 1), w, 1.6, d, 0, 0.8, 0, false);
    m1.castShadow = false;
    const m2 = box(g, mat(shade(color, -18), 1), w - 22, 0.6, d - 22, 0, 1.7, 0, false);
    m2.castShadow = false;
  },

  lamp(g, w, _d, h, color) {
    cyl(g, mat('#3a4049', 0.5, 0.4), 12, 14, 2.5, 0, 1.25, 0);
    cyl(g, mat('#3a4049', 0.5, 0.4), 1.4, 1.4, h - 32, 0, (h - 32) / 2 + 2.5, 0, 10);
    const shadeMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.9, emissive: '#ffd9a0', emissiveIntensity: 0.5, side: THREE.DoubleSide,
    });
    cyl(g, shadeMat, w * 0.38, w * 0.46, 26, 0, h - 15, 0);
  },

  plant(g, w, _d, h, color) {
    cyl(g, mat('#9c6b4f', 0.85), 12, 9, 24, 0, 12, 0);
    cyl(g, mat('#5a4434', 0.95), 11, 11, 2, 0, 24, 0);
    cyl(g, mat('#6b513c', 0.9), 1.6, 2.2, h * 0.4, 0, 24 + h * 0.2, 0, 8);
    const leaf1 = mat(color, 1);
    const leaf2 = mat(shade(color, -22), 1);
    const rnd = mulberry32(11);
    const cy = 24 + h * 0.42;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + rnd() * 0.6;
      const r = 6 + rnd() * 9;
      sphere(g, i % 2 ? leaf1 : leaf2, 10 + rnd() * 7, Math.cos(a) * r, cy + rnd() * (h * 0.3), Math.sin(a) * r);
    }
    sphere(g, leaf1, 12, 0, cy + h * 0.34, 0);
  },

  counter(g, w, d, h, color, def) {
    box(g, mat(color, 0.55), w, h - 14, d - 6, 0, (h - 14) / 2 + 10, -1);   // 柜体
    box(g, mat('#3c4148', 0.8), w - 8, 10, d - 18, 0, 5, -5);               // 踢脚
    box(g, mat('#caced3', 0.35), w, 4, d, 0, h - 2, 0);                     // 台面
    box(g, mat(shade(color, -30), 0.55), 1, h - 18, 1, 0, (h - 14) / 2 + 8, d / 2 - 3); // 门缝
    for (const s of [-1, 1]) {
      box(g, mat(CHROME, 0.3, 0.8), 10, 1.6, 1.6, s * w * 0.25, h - 18, d / 2 - 2);
    }
    if (def.sub === 'stove') {
      box(g, mat('#16191e', 0.15, 0.2), w - 12, 1.2, d - 18, 0, h + 0.5, 0);
      for (const s of [-1, 1]) {
        cyl(g, mat('#2c333c', 0.6), 9, 9, 1, s * w * 0.2, h + 1.4, 0);
        cyl(g, mat('#10131a', 0.6), 4.5, 4.5, 1.4, s * w * 0.2, h + 1.6, 0);
      }
    } else if (def.sub === 'sink') {
      box(g, mat('#9aa2a9', 0.3, 0.6), w - 24, 2, d - 26, 0, h - 0.6, 0);   // 水槽
      const tap = mat(CHROME, 0.25, 0.9);
      cyl(g, tap, 1.4, 1.4, 14, 0, h + 7, -d / 2 + 12, 10);
      box(g, tap, 2.4, 2.4, 12, 0, h + 14, -d / 2 + 17);
    }
  },

  fridge(g, w, d, h, color) {
    box(g, mat(color, 0.32, 0.25), w, h, d, 0, h / 2, 0);
    box(g, mat(shade(color, -48), 0.4), w, 1, 0.8, 0, h * 0.6, d / 2 + 0.3);
    const handle = mat(CHROME, 0.3, 0.85);
    box(g, handle, 2.2, h * 0.26, 2.6, -w / 2 + 7, h * 0.76, d / 2 + 1.8);
    box(g, handle, 2.2, h * 0.2, 2.6, -w / 2 + 7, h * 0.42, d / 2 + 1.8);
  },

  washer(g, w, d, h, color) {
    box(g, mat(color, 0.4, 0.15), w, h, d, 0, h / 2, 0);
    const r = Math.min(w, d) * 0.3;
    const ring = cyl(g, mat(CHROME, 0.3, 0.7), r + 3, r + 3, 2, 0, h * 0.5, d / 2 + 0.6);
    ring.rotation.x = Math.PI / 2;
    const glass = cyl(g, mat('#1c2127', 0.1, 0.4), r, r, 2.4, 0, h * 0.5, d / 2 + 1.4);
    glass.rotation.x = Math.PI / 2;
    box(g, mat('#2e343c', 0.5), w - 10, 5, 1.2, 0, h - 8, d / 2 + 0.5);
  },

  toilet(g, w, d, h, color) {
    const white = mat(color, 0.22);
    const base = cyl(g, white, w / 2 - 3, w / 2 - 6, 30, 0, 15, 5);
    base.scale.z = 1.35;
    const seat = cyl(g, white, w / 2, w / 2 - 2, 5, 0, 38, 5);
    seat.scale.z = 1.4;
    box(g, white, w - 4, 36, 15, 0, 36 + 18, -d / 2 + 8);                   // 水箱
    box(g, mat(CHROME, 0.3, 0.8), 8, 1.6, 4, 0, 56, -d / 2 + 8);            // 冲水钮
  },

  bathsink(g, w, d, h, color) {
    box(g, mat(color, 0.6), w, h - 18, d - 6, 0, (h - 18) / 2 + 4, 0);
    box(g, mat(WHITE, 0.25), w, 4, d, 0, h - 2, 0);
    const basin = cyl(g, mat(WHITE, 0.2), w * 0.3, w * 0.22, 10, 0, h + 4, 1);
    basin.scale.z = Math.min(1, (d * 0.72) / (w * 0.6));
    const tap = mat(CHROME, 0.25, 0.9);
    cyl(g, tap, 1.3, 1.3, 16, 0, h + 8, -d / 2 + 9, 10);
    box(g, tap, 2.2, 2.2, 10, 0, h + 15, -d / 2 + 13);
  },

  bathtub(g, w, d, h, color) {
    const white = mat(color, 0.2);
    box(g, white, w, h, d, 0, h / 2, 0);
    box(g, mat('#cfe5ec', 0.15), w - 16, 2, d - 16, 0, h - 3, 0);           // 水面
    box(g, white, w - 10, 3, d - 10, 0, h - 1, 0);
    const tap = mat(CHROME, 0.25, 0.9);
    cyl(g, tap, 1.6, 1.6, 14, -w / 2 + 12, h + 6, 0, 10);
    box(g, tap, 8, 2.2, 2.2, -w / 2 + 14, h + 12, 0);
  },

  shower(g, w, d, h, color) {
    box(g, mat(WHITE, 0.4), w, 6, d, 0, 3, 0);                              // 底盘
    const glass = mat(color, 0.05, 0, 0.22);
    box(g, glass, 1.2, h - 12, d - 4, w / 2 - 2, (h - 12) / 2 + 6, 0, false);
    box(g, glass, w - 4, h - 12, 1.2, 0, (h - 12) / 2 + 6, d / 2 - 2, false);
    const frame = mat(CHROME, 0.3, 0.8);
    for (const [fx, fz] of [[w / 2 - 2, d / 2 - 2], [w / 2 - 2, -d / 2 + 2], [-w / 2 + 2, d / 2 - 2]] as const) {
      box(g, frame, 2.5, h - 8, 2.5, fx, (h - 8) / 2 + 4, fz);
    }
    cyl(g, frame, 1.2, 1.2, 26, -w / 2 + 10, h - 22, -d / 2 + 10, 10);
    const head = cyl(g, frame, 7, 7, 1.6, -w / 2 + 16, h - 10, -d / 2 + 16);
    head.rotation.z = 0.3;
  },
};

/** 根据数据构建一件家具（含定位与旋转） */
export function buildItem(item: Item): THREE.Group {
  const def = defOf(item.defId);
  const g = new THREE.Group();
  builders[def.kind](g, item.w, item.d, item.h, item.color ?? def.color, def);
  g.position.set(item.x, 0, -item.y);
  g.rotation.y = (item.rot * Math.PI) / 180;
  g.userData.itemId = item.id;
  g.traverse(o => { o.userData.itemId = item.id; });
  return g;
}

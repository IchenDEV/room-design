import * as THREE from 'three';
import type { Item } from '../../core/types';
import { defaultTexture, defOf } from '../../core/catalog/catalog';
import type { FurnKind } from '../../core/catalog/catalog';
import type { Builder } from './seating3d';
import { sofa, chair, stool, barstool, bench } from './seating3d';
import { table, roundtable, tvstand, shelf } from './tables3d';
import { wardrobe, nightstand, dresser, fridge, waterdispenser, washer, counter } from './storage3d';
import { bed, toilet, bathsink, bathtub, shower } from './bedbath3d';
import { officedesk, officechair, filecabinet, whiteboard, printer, partition } from './office3d';
import { rug, lamp, plant, outlet, weakbox, accesspanel } from './decor3d';

const REG: Record<FurnKind, Builder> = {
  sofa, chair, stool, barstool, bench,
  table, roundtable, tvstand, shelf, officedesk,
  wardrobe, nightstand, dresser, fridge, waterdispenser, washer, counter,
  bed, toilet, bathsink, bathtub, shower,
  officechair, filecabinet, whiteboard, printer, partition,
  rug, lamp, plant, outlet, weakbox, accesspanel,
};

/** 构建带位置/旋转的家具组，userData.itemId 用于拾取 */
export function buildItem(it: Item): THREE.Group {
  const def = defOf(it.defId);
  const builder = REG[def.kind] ?? table;
  const g = builder(it.w, it.d, it.h, it.color ?? def.color, it.texture ?? defaultTexture(def));
  g.position.set(it.x, it.z ?? 0, -it.y);
  g.rotation.y = (it.rot * Math.PI) / 180;
  if (it.flipX) g.scale.x = -1;
  g.userData.itemId = it.id;
  g.traverse((o) => { o.userData.itemId = it.id; });
  return g;
}

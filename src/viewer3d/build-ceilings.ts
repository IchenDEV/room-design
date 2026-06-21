import * as THREE from 'three';
import type { Pt, ResolvedCeiling, RoomPoly } from '../core/types';
import { pointInPoly, polygonArea } from '../core/geometry/polygon';
import { ceilingLightMat, ceilingMat } from './mats';

const SAMPLE = 12;

function ceilingGeo(poly: Pt[]): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  poly.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)));
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function addBox(
  g: THREE.Group, w: number, h: number, d: number,
  x: number, y: number, z: number, rot: number, mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rot;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
}

function addPanel(g: THREE.Group, r: RoomPoly, h: number, c: ResolvedCeiling) {
  const mesh = new THREE.Mesh(ceilingGeo(r.poly), ceilingMat(c.color));
  mesh.position.y = h - 0.5;
  mesh.receiveShadow = true;
  g.add(mesh);
}

function addPerimeter(g: THREE.Group, r: RoomPoly, h: number, c: ResolvedCeiling, light: boolean) {
  const area = polygonArea(r.poly);
  for (let i = 0; i < r.poly.length; i++) {
    const a = r.poly[i], b = r.poly[(i + 1) % r.poly.length];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    if (len < 8) continue;
    const nx = area >= 0 ? -dy / len : dy / len;
    const ny = area >= 0 ? dx / len : -dx / len;
    const mx = (a.x + b.x) / 2 + nx * c.inset / 2;
    const my = (a.y + b.y) / 2 + ny * c.inset / 2;
    const rot = Math.atan2(dy, dx);
    addBox(g, len + c.inset, c.drop, c.inset, mx, h - c.drop / 2, -my, rot, ceilingMat(c.color));
    if (light) {
      const lx = (a.x + b.x) / 2 + nx * (c.inset + 1);
      const ly = (a.y + b.y) / 2 + ny * (c.inset + 1);
      addBox(g, Math.max(12, len - c.inset), 2, 3, lx, h - c.drop + 2, -ly, rot, ceilingLightMat);
    }
  }
}

function bounds(poly: Pt[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY };
}

function scanRuns(from: number, to: number, inside: (v: number) => boolean): [number, number][] {
  const runs: [number, number][] = [];
  let start: number | null = null;
  for (let v = from; v <= to; v += SAMPLE) {
    const hit = inside(v);
    if (hit && start === null) start = v;
    if (start !== null && (!hit || v + SAMPLE > to)) {
      const end = hit && v + SAMPLE > to ? to : v;
      if (end - start > 28) runs.push([start, end]);
      start = null;
    }
  }
  return runs;
}

function addGrid(g: THREE.Group, r: RoomPoly, h: number, c: ResolvedCeiling) {
  const b = bounds(r.poly);
  const step = Math.max(60, Math.min(140, c.inset * 1.7));
  const bar = Math.max(5, Math.min(12, c.inset * 0.14));
  const drop = Math.max(5, Math.min(18, c.drop));
  const mat = ceilingMat(c.color);
  for (let x = b.minX + step; x < b.maxX - step / 2; x += step) {
    for (const [y0, y1] of scanRuns(b.minY, b.maxY, (y) => pointInPoly({ x, y }, r.poly))) {
      addBox(g, bar, drop, y1 - y0, x, h - drop / 2, -(y0 + y1) / 2, 0, mat);
    }
  }
  for (let y = b.minY + step; y < b.maxY - step / 2; y += step) {
    for (const [x0, x1] of scanRuns(b.minX, b.maxX, (x) => pointInPoly({ x, y }, r.poly))) {
      addBox(g, x1 - x0, drop, bar, (x0 + x1) / 2, h - drop / 2, -y, 0, mat);
    }
  }
}

export function buildCeiling(group: THREE.Group, room: RoomPoly, height: number, ceiling: ResolvedCeiling) {
  if (ceiling.style === 'none') return;
  addPanel(group, room, height, ceiling);
  if (ceiling.style === 'tray') addPerimeter(group, room, height, ceiling, false);
  else if (ceiling.style === 'cove') addPerimeter(group, room, height, ceiling, true);
  else if (ceiling.style === 'grid') addGrid(group, room, height, ceiling);
}

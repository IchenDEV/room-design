import type { Store } from '../core/store';
import type { Pt, Item, Wall, RoomPoly } from '../core/types';
import { uid } from '../core/types';
import {
  dist, lerp, distPtSeg, wallLen, wallDir, wallNormal, wallA, wallB,
  pointInPoly, shade,
} from '../core/geometry';
import { defOf, floorOf } from '../core/catalog';
import { drawGlyph } from './glyphs';

interface Guide { axis: 'x' | 'y'; v: number }
interface EndRef { wallId: string; end: 'a' | 'b'; x0: number; y0: number }

type Hit =
  | { kind: 'item'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'wall'; id: string }
  | { kind: 'room'; room: RoomPoly }
  | null;

type Drag =
  | { kind: 'pan'; sx: number; sy: number; ox0: number; oy0: number }
  | { kind: 'item'; id: string; offX: number; offY: number; moved: boolean }
  | { kind: 'wallbody'; start: Pt; ends: EndRef[]; moved: boolean }
  | { kind: 'wallend'; ends: EndRef[]; moved: boolean }
  | { kind: 'opening'; id: string; moved: boolean }
  | { kind: 'rect'; a: Pt; b: Pt }
  | null;

const PAPER = '#f2f3f6';
const WALL_FILL = '#39424f';
const ACCENT = '#3b7dff';
const GUIDE = '#19af9f';

export class Editor2D {
  private ctx: CanvasRenderingContext2D;
  /** 视图变换：screen = (ox + x*s, oy - y*s) */
  view = { ox: 0, oy: 0, s: 0.55 };

  spaceDown = false;
  private drag: Drag = null;
  /** 画墙链：上一个端点 */
  private chainLast: Pt | null = null;
  private chainStart: Pt | null = null;
  private cursor: Pt = { x: 0, y: 0 };
  private snapPt: Pt | null = null;
  private guides: Guide[] = [];
  private hover: Hit = null;
  /** 门窗放置预览 */
  private openingGhost: { wall: Wall; t: number } | null = null;
  ghostRot = 0;
  private rafPending = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private store: Store,
    private hooks: { status: (coords: string, zoom: string) => void },
  ) {
    this.ctx = canvas.getContext('2d')!;

    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('dblclick', () => this.endChain());
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    new ResizeObserver(() => { this.resize(); this.requestDraw(); }).observe(canvas);
    this.resize();

    store.on('change', () => this.requestDraw());
    store.on('sel', () => this.requestDraw());
    store.on('ui', () => { this.syncToolState(); this.requestDraw(); });
    store.on('project', () => { this.fit(); this.requestDraw(); });
  }

  // ---------------- 视图 ----------------
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  w2s(p: Pt): Pt { return { x: this.view.ox + p.x * this.view.s, y: this.view.oy - p.y * this.view.s }; }
  s2w(sx: number, sy: number): Pt { return { x: (sx - this.view.ox) / this.view.s, y: (this.view.oy - sy) / this.view.s }; }

  fit() {
    const { walls, items } = this.store.project;
    const cw = this.canvas.clientWidth || 800, ch = this.canvas.clientHeight || 600;
    if (!walls.length && !items.length) {
      this.view.s = 0.55;
      this.view.ox = cw / 2 - 200;
      this.view.oy = ch / 2 + 200;
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const acc = (x: number, y: number) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    };
    for (const w of walls) { acc(w.ax, w.ay); acc(w.bx, w.by); }
    for (const it of items) { acc(it.x - it.w / 2, it.y - it.d / 2); acc(it.x + it.w / 2, it.y + it.d / 2); }
    const bw = Math.max(maxX - minX, 100), bh = Math.max(maxY - minY, 100);
    this.view.s = Math.min((cw - 120) / bw, (ch - 120) / bh);
    this.view.s = Math.max(0.08, Math.min(1.6, this.view.s));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    this.view.ox = cw / 2 - cx * this.view.s;
    this.view.oy = ch / 2 + cy * this.view.s;
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const w = this.s2w(mx, my);
    const k = Math.exp(-e.deltaY * 0.0014);
    const s = Math.max(0.08, Math.min(5, this.view.s * k));
    this.view.ox = mx - w.x * s;
    this.view.oy = my + w.y * s;
    this.view.s = s;
    this.pushStatus();
    this.requestDraw();
  };

  // ---------------- 工具状态 ----------------
  private syncToolState() {
    const t = this.store.ui.tool.type;
    if (t !== 'wall') { this.chainLast = null; this.chainStart = null; }
    if (t !== 'door' && t !== 'window') this.openingGhost = null;
    this.updateCursorStyle();
  }

  private updateCursorStyle() {
    const t = this.store.ui.tool.type;
    let c = 'default';
    if (this.drag?.kind === 'pan') c = 'grabbing';
    else if (this.spaceDown) c = 'grab';
    else if (t === 'wall' || t === 'rect' || t === 'door' || t === 'window' || t === 'place') c = 'crosshair';
    else if (this.hover && this.hover.kind !== 'room') c = 'move';
    this.canvas.style.cursor = c;
  }

  // ---------------- 命中检测 ----------------
  private hitItem(p: Pt, it: Item, pad = 2) {
    const th = (it.rot * Math.PI) / 180;
    const dx = p.x - it.x, dy = p.y - it.y;
    const c = Math.cos(th), s = Math.sin(th);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    return Math.abs(lx) <= it.w / 2 + pad && Math.abs(ly) <= it.d / 2 + pad;
  }

  private isRug(it: Item) { return defOf(it.defId).kind === 'rug'; }

  hitTest(p: Pt): Hit {
    const tol = 6 / this.view.s;
    const items = this.store.project.items;
    // 家具：非地毯优先，后绘制的优先
    const layered = [...items].sort((a, b) => (this.isRug(a) ? 0 : 1) - (this.isRug(b) ? 0 : 1));
    for (let i = layered.length - 1; i >= 0; i--) {
      if (this.hitItem(p, layered[i])) return { kind: 'item', id: layered[i].id };
    }
    for (const o of this.store.project.openings) {
      const w = this.store.wall(o.wallId);
      if (!w) continue;
      const pr = distPtSeg(p, wallA(w), wallB(w));
      const along = Math.abs(pr.t - o.t) * wallLen(w);
      if (along <= o.width / 2 + 4 && pr.d <= w.thickness / 2 + tol) return { kind: 'opening', id: o.id };
    }
    let best: { id: string; d: number } | null = null;
    for (const w of this.store.project.walls) {
      const pr = distPtSeg(p, wallA(w), wallB(w));
      if (pr.d <= w.thickness / 2 + tol && (!best || pr.d < best.d)) best = { id: w.id, d: pr.d };
    }
    if (best) return { kind: 'wall', id: best.id };
    for (const r of this.store.rooms) {
      if (pointInPoly(p, r.poly)) return { kind: 'room', room: r };
    }
    return null;
  }

  // ---------------- 吸附 ----------------
  /** 收集所有墙端点 */
  private nodePoints(excludeWallIds?: Set<string>): Pt[] {
    const pts: Pt[] = [];
    for (const w of this.store.project.walls) {
      if (excludeWallIds?.has(w.id)) continue;
      pts.push(wallA(w), wallB(w));
    }
    return pts;
  }

  /** 画墙端点吸附：端点 > 墙线投影 > 轴对齐/角度 > 栅格 */
  private snapWallPoint(p: Pt, angleFrom: Pt | null, free: boolean): Pt {
    this.guides = [];
    if (free) return { x: Math.round(p.x), y: Math.round(p.y) };
    const sr = 12 / this.view.s;

    // 1. 端点吸附
    let bestPt: Pt | null = null, bestD = sr;
    for (const n of this.nodePoints()) {
      const d = dist(p, n);
      if (d < bestD) { bestD = d; bestPt = n; }
    }
    if (bestPt) return { x: bestPt.x, y: bestPt.y };

    // 2. 墙线投影（T 形连接）
    for (const w of this.store.project.walls) {
      const pr = distPtSeg(p, wallA(w), wallB(w));
      if (pr.d < 8 / this.view.s) {
        const q = lerp(wallA(w), wallB(w), pr.t);
        return { x: Math.round(q.x), y: Math.round(q.y) };
      }
    }

    let out = { x: p.x, y: p.y };
    let axisX = false, axisY = false;
    // 3. 轴对齐
    const at = 7 / this.view.s;
    for (const n of this.nodePoints()) {
      if (!axisX && Math.abs(p.x - n.x) < at) { out.x = n.x; axisX = true; this.guides.push({ axis: 'x', v: n.x }); }
      if (!axisY && Math.abs(p.y - n.y) < at) { out.y = n.y; axisY = true; this.guides.push({ axis: 'y', v: n.y }); }
    }
    // 4. 角度吸附（15° 整数倍）
    if (angleFrom && !axisX && !axisY) {
      const dx = out.x - angleFrom.x, dy = out.y - angleFrom.y;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        const ang = Math.atan2(dy, dx);
        const stepped = Math.round(ang / (Math.PI / 12)) * (Math.PI / 12);
        if (Math.abs(stepped - ang) < 0.13) {
          out = {
            x: angleFrom.x + Math.cos(stepped) * len,
            y: angleFrom.y + Math.sin(stepped) * len,
          };
        }
      }
    }
    // 5. 栅格
    if (!axisX) out.x = Math.round(out.x / 10) * 10;
    if (!axisY) out.y = Math.round(out.y / 10) * 10;
    return out;
  }

  /** 家具移动/放置吸附：对齐其它家具中心与墙端点 */
  private snapItemPos(p: Pt, excludeId?: string): Pt {
    this.guides = [];
    const out = { x: Math.round(p.x), y: Math.round(p.y) };
    const at = 6 / this.view.s;
    const cands: Pt[] = this.nodePoints();
    for (const it of this.store.project.items) {
      if (it.id !== excludeId) cands.push({ x: it.x, y: it.y });
    }
    let ax = false, ay = false;
    for (const c of cands) {
      if (!ax && Math.abs(p.x - c.x) < at) { out.x = c.x; ax = true; this.guides.push({ axis: 'x', v: c.x }); }
      if (!ay && Math.abs(p.y - c.y) < at) { out.y = c.y; ay = true; this.guides.push({ axis: 'y', v: c.y }); }
    }
    return out;
  }

  /** 找最近的可放门窗的墙 */
  private nearestWall(p: Pt, maxD: number): { wall: Wall; t: number } | null {
    let best: { wall: Wall; t: number; d: number } | null = null;
    for (const w of this.store.project.walls) {
      const pr = distPtSeg(p, wallA(w), wallB(w));
      if (pr.d < maxD && (!best || pr.d < best.d)) best = { wall: w, t: pr.t, d: pr.d };
    }
    return best ? { wall: best.wall, t: best.t } : null;
  }

  /** 收集与某端点重合的所有墙端点（保持连接性整体移动） */
  private endGroup(pt: Pt): EndRef[] {
    const refs: EndRef[] = [];
    for (const w of this.store.project.walls) {
      if (dist(wallA(w), pt) < 2) refs.push({ wallId: w.id, end: 'a', x0: w.ax, y0: w.ay });
      if (dist(wallB(w), pt) < 2) refs.push({ wallId: w.id, end: 'b', x0: w.bx, y0: w.by });
    }
    return refs;
  }

  // ---------------- 指针事件 ----------------
  private evPos(e: PointerEvent): Pt {
    const rect = this.canvas.getBoundingClientRect();
    return this.s2w(e.clientX - rect.left, e.clientY - rect.top);
  }

  private onDown = (e: PointerEvent) => {
    if (e.button === 1 || e.button === 2 || this.spaceDown) {
      this.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox0: this.view.ox, oy0: this.view.oy };
      this.updateCursorStyle();
      return;
    }
    if (e.button !== 0) return;
    const p = this.evPos(e);
    const tool = this.store.ui.tool;

    if (tool.type === 'select') {
      const hit = this.hitTest(p);
      if (!hit) {
        this.store.setSel(null);
        this.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox0: this.view.ox, oy0: this.view.oy };
        return;
      }
      if (hit.kind === 'room') { this.store.selectRoom(hit.room); return; }
      this.store.setSel(hit);
      if (hit.kind === 'item') {
        const it = this.store.item(hit.id)!;
        this.store.begin();
        this.drag = { kind: 'item', id: it.id, offX: it.x - p.x, offY: it.y - p.y, moved: false };
      } else if (hit.kind === 'wall') {
        const w = this.store.wall(hit.id)!;
        const handle = 10 / this.view.s;
        let ends: EndRef[] | null = null;
        if (dist(p, wallA(w)) < handle) ends = this.endGroup(wallA(w));
        else if (dist(p, wallB(w)) < handle) ends = this.endGroup(wallB(w));
        this.store.begin();
        if (ends) this.drag = { kind: 'wallend', ends, moved: false };
        else {
          const ga = this.endGroup(wallA(w)), gb = this.endGroup(wallB(w));
          this.drag = { kind: 'wallbody', start: p, ends: [...ga, ...gb], moved: false };
        }
      } else if (hit.kind === 'opening') {
        this.store.begin();
        this.drag = { kind: 'opening', id: hit.id, moved: false };
      }
      return;
    }

    if (tool.type === 'wall') {
      const pt = this.snapWallPoint(p, this.chainLast, e.shiftKey);
      if (!this.chainLast) {
        this.chainLast = pt;
        this.chainStart = pt;
      } else {
        if (dist(pt, this.chainLast) < 5) return;
        const closing = this.chainStart && dist(pt, this.chainStart) < 8 / this.view.s + 2;
        const target = closing ? this.chainStart! : pt;
        const { wallThickness, wallHeight } = this.store.project.settings;
        const from = this.chainLast;
        this.store.commit(pr => {
          pr.walls.push({
            id: uid(), ax: from.x, ay: from.y, bx: target.x, by: target.y,
            thickness: wallThickness, height: wallHeight,
          });
        });
        if (closing) { this.chainLast = null; this.chainStart = null; }
        else this.chainLast = target;
      }
      this.requestDraw();
      return;
    }

    if (tool.type === 'rect') {
      const pt = this.snapWallPoint(p, null, e.shiftKey);
      this.drag = { kind: 'rect', a: pt, b: pt };
      return;
    }

    if (tool.type === 'door' || tool.type === 'window') {
      const near = this.nearestWall(p, 20 / this.view.s + 12);
      if (!near) return;
      const { wall } = near;
      const L = wallLen(wall);
      const isDoor = tool.type === 'door';
      const width = Math.min(isDoor ? 90 : 150, Math.max(40, L * 0.7));
      if (!this.store.openingFits(wall, width)) return;
      const tMin = (width / 2 + 5) / L;
      const t = Math.max(tMin, Math.min(1 - tMin, near.t));
      const o = {
        id: uid(), wallId: wall.id, kind: tool.type, t, width,
        height: isDoor ? 210 : 150,
        sill: isDoor ? 0 : 90,
      };
      this.store.commit(pr => { pr.openings.push(o); });
      this.store.setSel({ kind: 'opening', id: o.id });
      return;
    }

    if (tool.type === 'place') {
      const def = defOf(tool.defId);
      const pos = this.snapItemPos(p);
      const it: Item = {
        id: uid(), defId: def.id, x: pos.x, y: pos.y, rot: this.ghostRot,
        w: def.w, d: def.d, h: def.h,
      };
      this.store.commit(pr => { pr.items.push(it); });
      if (!e.shiftKey) {
        this.store.setTool({ type: 'select' });
        this.store.setSel({ kind: 'item', id: it.id });
      }
      return;
    }
  };

  private onMove = (e: PointerEvent) => {
    const p = this.evPos(e);
    this.cursor = p;
    this.pushStatus();

    const d = this.drag;
    if (d) {
      if (d.kind === 'pan') {
        this.view.ox = d.ox0 + (e.clientX - d.sx);
        this.view.oy = d.oy0 + (e.clientY - d.sy);
      } else if (d.kind === 'item') {
        d.moved = true;
        const pos = this.snapItemPos({ x: p.x + d.offX, y: p.y + d.offY }, d.id);
        this.store.update(pr => {
          const it = pr.items.find(i => i.id === d.id);
          if (it) { it.x = pos.x; it.y = pos.y; }
        });
      } else if (d.kind === 'wallbody') {
        d.moved = true;
        const dx = Math.round(p.x - d.start.x), dy = Math.round(p.y - d.start.y);
        this.store.update(pr => {
          for (const ref of d.ends) {
            const w = pr.walls.find(x => x.id === ref.wallId);
            if (!w) continue;
            if (ref.end === 'a') { w.ax = ref.x0 + dx; w.ay = ref.y0 + dy; }
            else { w.bx = ref.x0 + dx; w.by = ref.y0 + dy; }
          }
        });
      } else if (d.kind === 'wallend') {
        d.moved = true;
        this.guides = [];
        const np = { x: Math.round(p.x / 5) * 5, y: Math.round(p.y / 5) * 5 };
        this.store.update(pr => {
          for (const ref of d.ends) {
            const w = pr.walls.find(x => x.id === ref.wallId);
            if (!w) continue;
            if (ref.end === 'a') { w.ax = np.x; w.ay = np.y; }
            else { w.bx = np.x; w.by = np.y; }
          }
        });
      } else if (d.kind === 'opening') {
        d.moved = true;
        const o = this.store.opening(d.id);
        const w = o && this.store.wall(o.wallId);
        if (o && w) {
          const pr = distPtSeg(p, wallA(w), wallB(w));
          const L = wallLen(w);
          const tMin = (o.width / 2 + 5) / L;
          const t = Math.max(tMin, Math.min(1 - tMin, pr.t));
          this.store.update(prj => {
            const oo = prj.openings.find(x => x.id === o.id);
            if (oo) oo.t = t;
          });
        }
      } else if (d.kind === 'rect') {
        d.b = this.snapWallPoint(p, null, e.shiftKey);
      }
      this.requestDraw();
      return;
    }

    // 悬停状态
    const tool = this.store.ui.tool;
    if (tool.type === 'select') {
      this.hover = this.hitTest(p);
      this.guides = [];
    } else if (tool.type === 'wall') {
      this.snapPt = this.snapWallPoint(p, this.chainLast, e.shiftKey);
    } else if (tool.type === 'door' || tool.type === 'window') {
      const near = this.nearestWall(p, 20 / this.view.s + 12);
      this.openingGhost = near && this.store.openingFits(near.wall, 60)
        ? { wall: near.wall, t: near.t }
        : null;
    } else if (tool.type === 'place') {
      this.snapPt = this.snapItemPos(p);
    }
    this.updateCursorStyle();
    this.requestDraw();
  };

  private onUp = () => {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.kind === 'item' || d.kind === 'wallbody' || d.kind === 'wallend' || d.kind === 'opening') {
      this.store.end(d.moved);
      this.guides = [];
    } else if (d.kind === 'rect') {
      const { a, b } = d;
      const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
      if (w >= 60 && h >= 60) {
        const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
        const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
        const { wallThickness, wallHeight } = this.store.project.settings;
        this.store.commit(pr => {
          const mk = (ax: number, ay: number, bx: number, by: number) =>
            pr.walls.push({ id: uid(), ax, ay, bx, by, thickness: wallThickness, height: wallHeight });
          mk(x1, y1, x2, y1); mk(x2, y1, x2, y2); mk(x2, y2, x1, y2); mk(x1, y2, x1, y1);
        });
      }
    }
    this.updateCursorStyle();
    this.requestDraw();
  };

  // ---------------- 外部命令 ----------------
  escape() {
    if (this.chainLast) { this.chainLast = null; this.chainStart = null; }
    else if (this.store.ui.tool.type !== 'select') this.store.setTool({ type: 'select' });
    else this.store.setSel(null);
    this.requestDraw();
  }

  endChain() {
    this.chainLast = null;
    this.chainStart = null;
    this.requestDraw();
  }

  rotateSel() {
    const tool = this.store.ui.tool;
    if (tool.type === 'place') {
      this.ghostRot = (this.ghostRot + 90) % 360;
      this.requestDraw();
      return;
    }
    const s = this.store.sel;
    if (s?.kind === 'item') {
      this.store.commit(p => {
        const it = p.items.find(i => i.id === s.id);
        if (it) it.rot = (it.rot + 90) % 360;
      });
    }
  }

  nudge(dx: number, dy: number) {
    const s = this.store.sel;
    if (s?.kind !== 'item') return;
    this.store.commit(p => {
      const it = p.items.find(i => i.id === s.id);
      if (it) { it.x += dx; it.y += dy; }
    });
  }

  screenshot(): string {
    return this.canvas.toDataURL('image/png');
  }

  // ---------------- 渲染 ----------------
  requestDraw() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.draw();
    });
  }

  private pushStatus() {
    this.hooks.status(
      `${Math.round(this.cursor.x)}, ${Math.round(this.cursor.y)} cm`,
      `${Math.round(this.view.s * 100)}%`,
    );
  }

  private draw() {
    const ctx = this.ctx;
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, cw, ch);

    this.drawGrid(cw, ch);
    this.drawRooms();
    this.drawWalls();
    this.drawOpenings();
    this.drawItems();
    this.drawPreviews();
    this.drawGuides(cw, ch);
    this.drawDimensions();
  }

  private drawGrid(cw: number, ch: number) {
    const ctx = this.ctx, s = this.view.s;
    const step = s > 0.4 ? 25 : s > 0.18 ? 50 : 100;
    const tl = this.s2w(0, 0), br = this.s2w(cw, ch);
    ctx.lineWidth = 1;
    for (let gx = Math.floor(tl.x / step) * step; gx <= br.x; gx += step) {
      const sx = this.w2s({ x: gx, y: 0 }).x;
      ctx.strokeStyle = gx % 100 === 0 ? '#dde1e9' : '#e8ebf1';
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, ch); ctx.stroke();
    }
    for (let gy = Math.floor(br.y / step) * step; gy <= tl.y; gy += step) {
      const sy = this.w2s({ x: 0, y: gy }).y;
      ctx.strokeStyle = gy % 100 === 0 ? '#dde1e9' : '#e8ebf1';
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(cw, sy); ctx.stroke();
    }
  }

  private drawRooms() {
    const ctx = this.ctx;
    const sel = this.store.sel;
    for (const r of this.store.rooms) {
      const meta = r.metaId ? this.store.meta(r.metaId) : undefined;
      const mat = floorOf(meta?.floor);
      ctx.beginPath();
      r.poly.forEach((p, i) => {
        const sp = this.w2s(p);
        i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y);
      });
      ctx.closePath();
      ctx.fillStyle = mat.plan;
      ctx.fill();
      if (sel?.kind === 'room' && sel.metaId === r.metaId) {
        ctx.fillStyle = 'rgba(59,125,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // 标签
      const c = this.w2s(r.centroid);
      const m2 = r.area / 10000;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (m2 >= 2 && this.view.s > 0.22) {
        ctx.fillStyle = '#444c5b';
        ctx.font = '600 13px system-ui, "PingFang SC", sans-serif';
        ctx.fillText(this.store.roomName(r), c.x, c.y - 8);
        ctx.fillStyle = '#7d8593';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText(`${m2.toFixed(1)} ㎡`, c.x, c.y + 9);
      } else if (this.view.s > 0.3) {
        ctx.fillStyle = '#7d8593';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(`${m2.toFixed(1)}㎡`, c.x, c.y);
      }
    }
  }

  private wallQuad(w: Wall): Pt[] {
    const n = wallNormal(w);
    const h = w.thickness / 2;
    return [
      { x: w.ax + n.x * h, y: w.ay + n.y * h },
      { x: w.bx + n.x * h, y: w.by + n.y * h },
      { x: w.bx - n.x * h, y: w.by - n.y * h },
      { x: w.ax - n.x * h, y: w.ay - n.y * h },
    ];
  }

  private pathQuad(q: Pt[]) {
    const ctx = this.ctx;
    ctx.beginPath();
    q.forEach((p, i) => {
      const sp = this.w2s(p);
      i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y);
    });
    ctx.closePath();
  }

  private drawWalls() {
    const ctx = this.ctx;
    const sel = this.store.sel;
    for (const w of this.store.project.walls) {
      this.pathQuad(this.wallQuad(w));
      ctx.fillStyle = WALL_FILL;
      ctx.fill();
    }
    if (this.hover?.kind === 'wall' && this.store.ui.tool.type === 'select') {
      const w = this.store.wall(this.hover.id);
      if (w) {
        this.pathQuad(this.wallQuad(w));
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fill();
      }
    }
    if (sel?.kind === 'wall') {
      const w = this.store.wall(sel.id);
      if (w) {
        this.pathQuad(this.wallQuad(w));
        ctx.fillStyle = 'rgba(59,125,255,0.55)';
        ctx.fill();
        for (const p of [wallA(w), wallB(w)]) {
          const sp = this.w2s(p);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = ACCENT;
          ctx.stroke();
        }
      }
    }
  }

  private drawOpeningSymbol(o: { kind: string; t: number; width: number }, w: Wall, ghost = false) {
    const ctx = this.ctx, s = this.view.s;
    const L = wallLen(w);
    if (L < 10) return;
    const C = lerp(wallA(w), wallB(w), o.t);
    const dir = wallDir(w), n = wallNormal(w);
    const hw = o.width / 2, ht = w.thickness / 2 + 1;
    const corner = (du: number, dv: number): Pt =>
      this.w2s({ x: C.x + dir.x * du + n.x * dv, y: C.y + dir.y * du + n.y * dv });

    ctx.save();
    if (ghost) ctx.globalAlpha = 0.65;
    // 在墙上"开洞"
    ctx.beginPath();
    for (const [du, dv] of [[-hw, ht], [hw, ht], [hw, -ht], [-hw, -ht]] as const) {
      const p = corner(du, dv);
      du === -hw && dv === ht ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = ghost ? '#dbe7ff' : PAPER;
    ctx.fill();

    const stroke = ghost ? ACCENT : '#49525f';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.2, 1.6 * Math.min(s, 1.4));

    if (o.kind === 'door') {
      // 铰链 + 门扇 + 开启弧线
      const hinge = { x: C.x - dir.x * hw, y: C.y - dir.y * hw };
      const tip = { x: hinge.x + n.x * o.width, y: hinge.y + n.y * o.width };
      const sh = this.w2s(hinge), st = this.w2s(tip);
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(st.x, st.y); ctx.stroke();
      const a0 = Math.atan2(-(n.y), n.x);
      const a1 = Math.atan2(-(dir.y), dir.x);
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, o.width * s, Math.min(a0, a1), Math.max(a0, a1));
      ctx.stroke();
      // 门槛两侧短线
      for (const sgn of [-1, 1]) {
        const p1 = corner(sgn * hw, ht), p2 = corner(sgn * hw, -ht);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    } else {
      // 窗：边框 + 中线
      ctx.beginPath();
      for (const [du, dv] of [[-hw, ht], [hw, ht], [hw, -ht], [-hw, -ht]] as const) {
        const p = corner(du, dv);
        du === -hw && dv === ht ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
      const m1 = corner(-hw, 0), m2 = corner(hw, 0);
      ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
    }
    ctx.restore();
  }

  private drawOpenings() {
    const sel = this.store.sel;
    for (const o of this.store.project.openings) {
      const w = this.store.wall(o.wallId);
      if (!w) continue;
      this.drawOpeningSymbol(o, w);
      if (sel?.kind === 'opening' && sel.id === o.id) {
        const ctx = this.ctx;
        const C = this.w2s(lerp(wallA(w), wallB(w), o.t));
        ctx.beginPath();
        ctx.arc(C.x, C.y, Math.max(10, (o.width / 2) * this.view.s + 6), 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  private drawItemAt(it: Item, ghost = false) {
    const ctx = this.ctx, s = this.view.s;
    const c = this.w2s({ x: it.x, y: it.y });
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.55;
    ctx.translate(c.x, c.y);
    ctx.rotate((-it.rot * Math.PI) / 180);
    ctx.scale(s, -s);
    drawGlyph(ctx, defOf(it.defId), it.w, it.d, it.color);
    ctx.restore();
  }

  private drawItems() {
    const sel = this.store.sel;
    const items = this.store.project.items;
    for (const it of items) if (this.isRug(it)) this.drawItemAt(it);
    for (const it of items) if (!this.isRug(it)) this.drawItemAt(it);

    if (sel?.kind === 'item') {
      const it = this.store.item(sel.id);
      if (it) {
        const ctx = this.ctx, s = this.view.s;
        const c = this.w2s({ x: it.x, y: it.y });
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((-it.rot * Math.PI) / 180);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          (-it.w / 2 - 5) * s, (-it.d / 2 - 5) * s,
          (it.w + 10) * s, (it.d + 10) * s,
        );
        ctx.setLineDash([]);
        ctx.restore();
        // 名称标签
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        const label = defOf(it.defId).name;
        const ty = c.y + (it.d / 2) * s + 16;
        const tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = 'rgba(31,38,48,0.85)';
        ctx.beginPath();
        ctx.roundRect(c.x - tw / 2, ty - 9, tw, 17, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, c.x, ty);
      }
    }
  }

  private drawPreviews() {
    const ctx = this.ctx, s = this.view.s;
    const tool = this.store.ui.tool;

    // 画墙橡皮筋
    if (tool.type === 'wall' && this.snapPt) {
      const pt = this.snapPt;
      const sp = this.w2s(pt);
      if (this.chainLast) {
        const sc = this.w2s(this.chainLast);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = Math.max(2, this.store.project.settings.wallThickness * s * 0.6);
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.moveTo(sc.x, sc.y); ctx.lineTo(sp.x, sp.y); ctx.stroke();
        ctx.globalAlpha = 1;
        const len = dist(this.chainLast, pt);
        this.labelPill(`${Math.round(len)} cm`, (sc.x + sp.x) / 2, (sc.y + sp.y) / 2 - 16, ACCENT, '#fff');
      }
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT;
      ctx.fill();
      if (this.chainStart) {
        const ss = this.w2s(this.chainStart);
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    // 矩形房间预览
    if (this.drag?.kind === 'rect') {
      const { a, b } = this.drag;
      const p1 = this.w2s(a), p2 = this.w2s(b);
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
      ctx.setLineDash([]);
      const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
      this.labelPill(`${Math.round(w)} × ${Math.round(h)} cm`, (p1.x + p2.x) / 2, Math.min(p1.y, p2.y) - 14, ACCENT, '#fff');
    }

    // 门窗放置预览
    if ((tool.type === 'door' || tool.type === 'window') && this.openingGhost) {
      const { wall, t } = this.openingGhost;
      const L = wallLen(wall);
      const isDoor = tool.type === 'door';
      const width = Math.min(isDoor ? 90 : 150, Math.max(40, L * 0.7));
      const tMin = (width / 2 + 5) / L;
      const tc = Math.max(tMin, Math.min(1 - tMin, t));
      this.drawOpeningSymbol({ kind: tool.type, t: tc, width }, wall, true);
    }

    // 家具放置幽灵
    if (tool.type === 'place' && this.snapPt) {
      const def = defOf(tool.defId);
      this.drawItemAt({
        id: '_ghost', defId: def.id, x: this.snapPt.x, y: this.snapPt.y,
        rot: this.ghostRot, w: def.w, d: def.d, h: def.h,
      }, true);
    }
  }

  private drawGuides(cw: number, ch: number) {
    if (!this.guides.length) return;
    const ctx = this.ctx;
    ctx.strokeStyle = GUIDE;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.8;
    for (const g of this.guides) {
      ctx.beginPath();
      if (g.axis === 'x') {
        const sx = this.w2s({ x: g.v, y: 0 }).x;
        ctx.moveTo(sx, 0); ctx.lineTo(sx, ch);
      } else {
        const sy = this.w2s({ x: 0, y: g.v }).y;
        ctx.moveTo(0, sy); ctx.lineTo(cw, sy);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private labelPill(text: string, x: number, y: number, bg = 'rgba(255,255,255,0.92)', fg = '#4a5260') {
    const ctx = this.ctx;
    ctx.font = '11px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 9, w, 17, 5);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.fillText(text, x, y);
  }

  private drawDimensions() {
    if (this.view.s < 0.26) return;
    const sel = this.store.sel;
    for (const w of this.store.project.walls) {
      const L = wallLen(w);
      if (L < 50) continue;
      const mid = lerp(wallA(w), wallB(w), 0.5);
      const n = wallNormal(w);
      const off = w.thickness / 2 + 16 / this.view.s;
      const pos = this.w2s({ x: mid.x + n.x * off, y: mid.y + n.y * off });
      const isSel = sel?.kind === 'wall' && sel.id === w.id;
      this.labelPill(
        `${Math.round(L)}`,
        pos.x, pos.y,
        isSel ? ACCENT : 'rgba(255,255,255,0.88)',
        isSel ? '#fff' : '#6b7382',
      );
    }
  }
}

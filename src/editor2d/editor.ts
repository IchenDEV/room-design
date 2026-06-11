import type { Pt } from '../core/types';
import type { Store } from '../core/store/store';
import { initialState } from './state';
import type { EditorState } from './state';
import { bindInput } from './input';
import { drawAll } from './render/render';
import { palOf } from './palette';
import type { Pal } from './palette';
import { setStatus } from '../ui/statusBus';

export class Editor2D {
  ctx: CanvasRenderingContext2D;
  view = { ox: 0, oy: 0, s: 0.55 };
  st: EditorState = initialState();
  spaceDown = false;
  private rafQueued = false;
  private unsubs: (() => void)[] = [];
  private ro: ResizeObserver;

  constructor(public canvas: HTMLCanvasElement, public store: Store) {
    this.ctx = canvas.getContext('2d')!;
    this.unsubs.push(bindInput(this));
    this.ro = new ResizeObserver(() => { this.resize(); this.requestDraw(); });
    this.ro.observe(canvas.parentElement ?? canvas);
    const redraw = () => this.requestDraw();
    this.unsubs.push(
      this.store.on('change', redraw),
      this.store.on('sel', redraw),
      this.store.on('ui', redraw),
      this.store.on('project', () => { this.fit(); redraw(); }),
    );
    this.resize();
    this.fit();
  }

  dispose() { this.unsubs.forEach((u) => u()); this.ro.disconnect(); }

  get pal(): Pal { return palOf(this.store.ui.theme); }

  resize() {
    const host = this.canvas.parentElement ?? this.canvas;
    const r = host.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.canvas.style.width = `${r.width}px`;
    this.canvas.style.height = `${r.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  cssSize(): Pt {
    return { x: this.canvas.width / (window.devicePixelRatio || 1), y: this.canvas.height / (window.devicePixelRatio || 1) };
  }

  w2s(p: Pt): Pt { return { x: p.x * this.view.s + this.view.ox, y: -p.y * this.view.s + this.view.oy }; }
  s2w(sx: number, sy: number): Pt { return { x: (sx - this.view.ox) / this.view.s, y: -(sy - this.view.oy) / this.view.s }; }

  evPos(e: PointerEvent | MouseEvent | WheelEvent): Pt {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  fit() {
    const walls = this.store.project.walls;
    const size = this.cssSize();
    let minX = 0, minY = 0, maxX = 900, maxY = 700;
    if (walls.length) {
      minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
      for (const w of walls) {
        for (const p of [w.a, w.b]) {
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
      }
    }
    const pad = 90;
    const sw = (size.x - pad * 2) / Math.max(200, maxX - minX);
    const sh = (size.y - pad * 2) / Math.max(200, maxY - minY);
    this.view.s = Math.max(0.05, Math.min(2.2, Math.min(sw, sh)));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    this.view.ox = size.x / 2 - cx * this.view.s;
    this.view.oy = size.y / 2 + cy * this.view.s;
    this.requestDraw();
  }

  zoomAt(sx: number, sy: number, factor: number) {
    const before = this.s2w(sx, sy);
    this.view.s = Math.max(0.05, Math.min(4, this.view.s * factor));
    const after = this.w2s(before);
    this.view.ox += sx - after.x;
    this.view.oy += sy - after.y;
    this.pushStatus();
    this.requestDraw();
  }

  requestDraw() {
    if (this.rafQueued) return;
    this.rafQueued = true;
    requestAnimationFrame(() => { this.rafQueued = false; drawAll(this); });
  }

  pushStatus() {
    const p = this.st.hoverPt;
    setStatus(
      p ? `X ${Math.round(p.x)}  Y ${Math.round(p.y)} cm` : '—',
      `${Math.round(this.view.s * 100)}%`,
    );
  }

  screenshot() {
    const url = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `平面图_${Date.now()}.png`;
    a.click();
  }
}

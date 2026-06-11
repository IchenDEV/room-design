import type { Store } from '../core/store';
import { FLOORS, WALL_COLORS, ITEM_COLORS, defOf, floorOf } from '../core/catalog';
import { wallLen } from '../core/geometry';

export function initProps(store: Store, actions: { screenshot: () => void }) {
  const root = document.getElementById('props')!;
  const title = document.getElementById('propsTitle')!;
  let curKey = '';

  // ---------- DOM 小工具 ----------
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function row(label: string, control: HTMLElement, out?: HTMLElement) {
    const div = el('div', 'prop-row');
    const lab = el('div', 'prop-label');
    lab.append(el('span', '', label));
    if (out) lab.append(out);
    div.append(lab, control);
    return div;
  }

  /** 滑杆：input 实时更新（事务），change 提交 */
  function slider(opts: {
    min: number; max: number; step?: number; value: number;
    fmt?: (v: number) => string;
    apply: (v: number) => void;
  }) {
    const fmt = opts.fmt ?? (v => `${Math.round(v)} cm`);
    const input = el('input') as HTMLInputElement;
    input.type = 'range';
    input.min = String(opts.min);
    input.max = String(opts.max);
    input.step = String(opts.step ?? 1);
    input.value = String(opts.value);
    const out = el('output', '', fmt(opts.value)) as HTMLOutputElement;
    let began = false;
    input.addEventListener('input', () => {
      const v = +input.value;
      out.textContent = fmt(v);
      if (!began) { store.begin(); began = true; }
      store.update(() => opts.apply(v));
    });
    input.addEventListener('change', () => {
      if (began) { store.end(); began = false; }
    });
    return { input, out };
  }

  function numberInput(value: number, apply: (v: number) => void, min = 10, max = 600) {
    const input = el('input') as HTMLInputElement;
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.value = String(Math.round(value));
    input.addEventListener('change', () => {
      const v = Math.max(min, Math.min(max, +input.value || min));
      input.value = String(v);
      store.commit(() => apply(v));
    });
    return input;
  }

  function swatches(colors: string[], current: string | undefined, pick: (c: string | undefined) => void, allowReset = false) {
    const box = el('div', 'swatches');
    if (allowReset) {
      const r = el('div', 'swatch reset', '×');
      r.title = '恢复默认颜色';
      if (!current) r.classList.add('active');
      r.addEventListener('click', () => pick(undefined));
      box.append(r);
    }
    for (const c of colors) {
      const s = el('div', 'swatch');
      s.style.background = c;
      s.title = c;
      if (current && current.toLowerCase() === c.toLowerCase()) s.classList.add('active');
      s.addEventListener('click', () => pick(c));
      box.append(s);
    }
    return box;
  }

  function kv(k: string, v: string) {
    const div = el('div', 'readonly-kv');
    div.append(el('span', 'k', k), el('span', 'v', v));
    return div;
  }

  function btn(label: string, cls: string, fn: () => void) {
    const b = el('button', `btn ${cls}`, label);
    b.addEventListener('click', fn);
    return b;
  }

  // ---------- 各类面板 ----------
  function renderGlobal() {
    title.textContent = '工程设置';
    const p = store.project;

    const hs = slider({
      min: 220, max: 400, value: p.settings.wallHeight,
      apply: v => {
        p.settings.wallHeight = v;
        for (const w of p.walls) w.height = v;
      },
    });
    root.append(row('层高（应用到全部墙体）', hs.input, hs.out));

    const ts = slider({
      min: 8, max: 40, value: p.settings.wallThickness,
      apply: v => { p.settings.wallThickness = v; },
    });
    root.append(row('新建墙体厚度', ts.input, ts.out));

    root.append(row('墙面颜色（3D）', swatches(WALL_COLORS, p.settings.wallColor, c => {
      if (c) store.commit(prj => { prj.settings.wallColor = c; });
    })));

    const chk = el('label', 'check-row') as HTMLLabelElement;
    const cb = el('input') as HTMLInputElement;
    cb.type = 'checkbox';
    cb.checked = p.settings.showCeiling;
    cb.addEventListener('change', () => store.commit(prj => { prj.settings.showCeiling = cb.checked; }));
    chk.append(cb, el('span', '', '在 3D 中显示天花板'));
    root.append(row('显示', chk));

    root.append(el('hr', 'prop-hr'));

    const s = store.stats;
    const box = el('div', 'stats-box');
    box.append(
      kv('房间数', String(s.rooms)),
      kv('套内面积', `${s.area.toFixed(1)} ㎡`),
      kv('墙体 / 门窗', `${s.walls} / ${s.openings}`),
      kv('家具数量', String(s.items)),
    );
    root.append(box);

    root.append(
      btn('载入示例方案', '', () => store.loadSample()),
      btn('导出当前视图 PNG', '', actions.screenshot),
      btn('清空方案', 'danger', () => { if (confirm('确定清空当前方案？')) store.clearAll(); }),
    );

    root.append(el('div', 'props-empty-tip',
      '提示：左侧素材库选择家具后在画布单击放置；使用「画墙」工具绘制户型，墙体围合后自动识别房间。'));
  }

  function renderWall(id: string) {
    const w = store.wall(id);
    if (!w) return renderGlobal();
    title.textContent = '墙体属性';
    root.append(kv('长度', `${Math.round(wallLen(w))} cm`));

    const ts = slider({
      min: 6, max: 50, value: w.thickness,
      apply: v => { const ww = store.wall(id); if (ww) ww.thickness = v; },
    });
    root.append(row('厚度', ts.input, ts.out));

    const hs = slider({
      min: 220, max: 400, value: w.height,
      apply: v => { const ww = store.wall(id); if (ww) ww.height = v; },
    });
    root.append(row('高度', hs.input, hs.out));

    root.append(btn('删除墙体（含门窗）', 'danger', () => store.deleteSelection()));
  }

  function renderOpening(id: string) {
    const o = store.opening(id);
    const w = o && store.wall(o.wallId);
    if (!o || !w) return renderGlobal();
    const isDoor = o.kind === 'door';
    title.textContent = isDoor ? '门属性' : '窗属性';

    const maxW = Math.min(400, Math.floor(wallLen(w) - 12));
    const ws = slider({
      min: 40, max: Math.max(60, maxW), value: o.width,
      apply: v => {
        const oo = store.opening(id);
        const ww = oo && store.wall(oo.wallId);
        if (!oo || !ww) return;
        oo.width = v;
        const L = wallLen(ww);
        const tMin = (v / 2 + 5) / L;
        oo.t = Math.max(tMin, Math.min(1 - tMin, oo.t));
      },
    });
    root.append(row('宽度', ws.input, ws.out));

    const hs = slider({
      min: isDoor ? 180 : 40, max: 260, value: o.height,
      apply: v => {
        const oo = store.opening(id);
        const ww = oo && store.wall(oo.wallId);
        if (!oo || !ww) return;
        oo.height = Math.min(v, ww.height - oo.sill - 5);
      },
    });
    root.append(row('高度', hs.input, hs.out));

    if (!isDoor) {
      const ss = slider({
        min: 0, max: 220, value: o.sill,
        apply: v => {
          const oo = store.opening(id);
          const ww = oo && store.wall(oo.wallId);
          if (!oo || !ww) return;
          oo.sill = Math.min(v, ww.height - oo.height - 5);
        },
      });
      root.append(row('离地高度', ss.input, ss.out));
    }

    root.append(btn(isDoor ? '删除门' : '删除窗', 'danger', () => store.deleteSelection()));
  }

  function renderItem(id: string) {
    const it = store.item(id);
    if (!it) return renderGlobal();
    const def = defOf(it.defId);
    title.textContent = `家具 · ${def.name}`;

    const rs = slider({
      min: 0, max: 359, value: ((it.rot % 360) + 360) % 360,
      fmt: v => `${Math.round(v)}°`,
      apply: v => { const i = store.item(id); if (i) i.rot = v; },
    });
    root.append(row('旋转角度', rs.input, rs.out));

    const trio = el('div', 'num-trio');
    const mk = (label: string, value: number, apply: (v: number) => void) => {
      const box = el('div');
      box.append(el('div', 'mini-label', label), numberInput(value, apply));
      return box;
    };
    trio.append(
      mk('宽 cm', it.w, v => { const i = store.item(id); if (i) i.w = v; }),
      mk('深 cm', it.d, v => { const i = store.item(id); if (i) i.d = v; }),
      mk('高 cm', it.h, v => { const i = store.item(id); if (i) i.h = v; }),
    );
    root.append(row('尺寸', trio));

    root.append(row('主体颜色', swatches(ITEM_COLORS, it.color, c => {
      store.commit(() => { const i = store.item(id); if (i) i.color = c; });
    }, true)));

    root.append(btn('删除家具', 'danger', () => store.deleteSelection()));
  }

  function renderRoom(metaId: string) {
    const meta = store.meta(metaId);
    const room = store.roomByMeta(metaId);
    if (!meta || !room) return renderGlobal();
    title.textContent = '房间属性';

    const nameInput = el('input') as HTMLInputElement;
    nameInput.type = 'text';
    nameInput.placeholder = store.roomName(room);
    nameInput.value = meta.name ?? '';
    nameInput.addEventListener('change', () => {
      store.commit(() => { const m = store.meta(metaId); if (m) m.name = nameInput.value.trim() || undefined; });
    });
    root.append(row('房间名称', nameInput));

    root.append(kv('面积', `${(room.area / 10000).toFixed(2)} ㎡`));
    root.append(kv('周长', `${Math.round(room.poly.reduce((s, p, i) => {
      const q = room.poly[(i + 1) % room.poly.length];
      return s + Math.hypot(q.x - p.x, q.y - p.y);
    }, 0))} cm`));

    const grid = el('div', 'mat-grid');
    const cur = floorOf(meta.floor).id;
    for (const f of FLOORS) {
      const card = el('div', 'mat-card' + (f.id === cur ? ' active' : ''));
      const chip = el('div', 'mat-chip');
      chip.style.background = f.plan;
      card.append(chip, el('span', '', f.name));
      card.addEventListener('click', () => {
        store.commit(() => { const m = store.meta(metaId); if (m) m.floor = f.id; });
      });
      grid.append(card);
    }
    root.append(row('地板材质', grid));
  }

  // ---------- 渲染调度 ----------
  function selKey() {
    const s = store.sel;
    if (!s) return 'none';
    return s.kind + ':' + ('id' in s ? s.id : s.metaId);
  }

  function render() {
    curKey = selKey();
    root.innerHTML = '';
    const s = store.sel;
    if (!s) renderGlobal();
    else if (s.kind === 'wall') renderWall(s.id);
    else if (s.kind === 'opening') renderOpening(s.id);
    else if (s.kind === 'item') renderItem(s.id);
    else renderRoom(s.metaId);
  }

  store.on('sel', render);
  store.on('change', e => {
    if (e?.transient) return;
    // 焦点在面板内（如正在拖动滑杆）时不重建 DOM
    if (root.contains(document.activeElement) && curKey === selKey()) return;
    render();
  });

  render();
}

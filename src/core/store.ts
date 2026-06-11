import type { Project, RoomPoly, Selection, Tool, Wall, Opening, Item, RoomMeta } from './types';
import { emptyProject, uid } from './types';
import { detectRooms, pointInPoly, wallLen } from './geometry';
import { makeSample } from './sample';

const LS_KEY = 'qiju_project_v1';
const UNDO_CAP = 100;

type EventName = 'change' | 'sel' | 'ui' | 'saved' | 'project';
type Listener = (payload?: { transient?: boolean }) => void;

export class Store {
  project: Project;
  rooms: RoomPoly[] = [];
  sel: Selection | null = null;
  ui = { mode: '2d' as '2d' | '3d', tool: { type: 'select' } as Tool, walking: false };

  private listeners = new Map<EventName, Set<Listener>>();
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private txnSnap: string | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.project = this.loadInitial();
    this.recompute();
  }

  // ---------- 事件 ----------
  on(ev: EventName, fn: Listener) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set());
    this.listeners.get(ev)!.add(fn);
  }
  emit(ev: EventName, payload?: { transient?: boolean }) {
    this.listeners.get(ev)?.forEach(fn => fn(payload));
  }

  // ---------- 派生数据 ----------
  recompute() {
    this.rooms = detectRooms(this.project.walls);
    for (const room of this.rooms) {
      const meta = this.project.roomMetas.find(m => pointInPoly(m.anchor, room.poly));
      room.metaId = meta ? meta.id : null;
    }
  }

  get stats() {
    const area = this.rooms.reduce((s, r) => s + r.area, 0) / 10000;
    return {
      rooms: this.rooms.length,
      area,
      walls: this.project.walls.length,
      openings: this.project.openings.length,
      items: this.project.items.length,
    };
  }

  // ---------- 查询 ----------
  wall(id: string): Wall | undefined { return this.project.walls.find(w => w.id === id); }
  opening(id: string): Opening | undefined { return this.project.openings.find(o => o.id === id); }
  item(id: string): Item | undefined { return this.project.items.find(i => i.id === id); }
  meta(id: string): RoomMeta | undefined { return this.project.roomMetas.find(m => m.id === id); }
  roomByMeta(metaId: string): RoomPoly | undefined { return this.rooms.find(r => r.metaId === metaId); }

  roomName(room: RoomPoly): string {
    const meta = room.metaId ? this.meta(room.metaId) : undefined;
    if (meta?.name) return meta.name;
    return `房间 ${this.rooms.indexOf(room) + 1}`;
  }

  // ---------- 修改（带撤销快照） ----------
  private snapshot() { return JSON.stringify(this.project); }

  commit(mut: (p: Project) => void) {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > UNDO_CAP) this.undoStack.shift();
    this.redoStack = [];
    mut(this.project);
    this.afterChange();
  }

  /** 拖拽事务：begin -> update(多次) -> end(true 提交 / false 回滚) */
  begin() {
    if (this.txnSnap !== null) return;
    this.txnSnap = this.snapshot();
  }
  update(mut: (p: Project) => void) {
    mut(this.project);
    this.recompute();
    this.emit('change', { transient: true });
  }
  end(commitIt = true) {
    if (this.txnSnap === null) return;
    const snap = this.txnSnap;
    this.txnSnap = null;
    if (commitIt) {
      this.undoStack.push(snap);
      if (this.undoStack.length > UNDO_CAP) this.undoStack.shift();
      this.redoStack = [];
      this.afterChange();
    } else {
      this.project = JSON.parse(snap);
      this.afterChange(false);
    }
  }

  private afterChange(save = true) {
    this.recompute();
    this.validateSel();
    this.emit('change');
    if (save) this.scheduleSave();
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshot());
    this.project = JSON.parse(this.undoStack.pop()!);
    this.afterChange();
  }
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshot());
    this.project = JSON.parse(this.redoStack.pop()!);
    this.afterChange();
  }

  // ---------- 选择 ----------
  setSel(sel: Selection | null) {
    this.sel = sel;
    this.emit('sel');
  }

  /** 选中房间：若无元数据则惰性创建（不入撤销栈） */
  selectRoom(room: RoomPoly) {
    if (!room.metaId) {
      const meta: RoomMeta = { id: uid(), anchor: { ...room.centroid } };
      this.project.roomMetas.push(meta);
      room.metaId = meta.id;
      this.scheduleSave();
    }
    this.setSel({ kind: 'room', metaId: room.metaId! });
  }

  private validateSel() {
    const s = this.sel;
    if (!s) return;
    const ok =
      (s.kind === 'wall' && !!this.wall(s.id)) ||
      (s.kind === 'opening' && !!this.opening(s.id)) ||
      (s.kind === 'item' && !!this.item(s.id)) ||
      (s.kind === 'room' && !!this.roomByMeta(s.metaId));
    if (!ok) this.setSel(null);
  }

  /** 删除墙体并级联其门窗 */
  removeWall(p: Project, wallId: string) {
    p.walls = p.walls.filter(w => w.id !== wallId);
    p.openings = p.openings.filter(o => o.wallId !== wallId);
  }

  deleteSelection() {
    const s = this.sel;
    if (!s) return;
    if (s.kind === 'wall') this.commit(p => this.removeWall(p, s.id));
    else if (s.kind === 'opening') this.commit(p => { p.openings = p.openings.filter(o => o.id !== s.id); });
    else if (s.kind === 'item') this.commit(p => { p.items = p.items.filter(i => i.id !== s.id); });
    else return; // 房间不支持直接删除
    this.setSel(null);
  }

  // ---------- 工具 / 模式 ----------
  setTool(tool: Tool) {
    this.ui.tool = tool;
    this.emit('ui');
  }
  setMode(mode: '2d' | '3d') {
    if (this.ui.mode === mode) return;
    this.ui.mode = mode;
    if (mode === '3d') this.setTool({ type: 'select' });
    this.emit('ui');
  }
  setWalking(on: boolean) {
    this.ui.walking = on;
    this.emit('ui');
  }

  // ---------- 持久化 ----------
  private loadInitial(): Project {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Project;
        if (p && p.version === 1 && Array.isArray(p.walls)) return p;
      }
    } catch { /* 损坏数据回退到示例 */ }
    return makeSample();
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, this.snapshot());
        this.emit('saved');
      } catch { /* 存储已满等情况忽略 */ }
    }, 500);
  }

  loadSample() {
    this.commit(p => Object.assign(p, makeSample()));
    this.setSel(null);
    this.emit('project');
  }

  clearAll() {
    this.commit(p => Object.assign(p, emptyProject()));
    this.setSel(null);
    this.emit('project');
  }

  /** 校验墙上开洞是否放得下 */
  openingFits(wall: Wall, width: number) {
    return wallLen(wall) > width + 10;
  }
}

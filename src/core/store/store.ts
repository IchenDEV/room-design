import type { CtxMenu, Project, RoomPoly, Selection, Theme, Tool, ViewMode } from '../types';
import type { UserProfile } from '../auth/types';
import { detectRooms } from '../geometry/rooms';
import { pointInPoly } from '../geometry/polygon';
import { defaultSample } from '../samples';
import { pruneGroups } from './item-groups';
import { Emitter, type EventName, type ChangeInfo } from './store-events';

export type { EventName, ChangeInfo } from './store-events';

export interface UIState {
  mode: ViewMode; tool: Tool; walking: boolean; theme: Theme;
  ctx: CtxMenu | null; hydrated: boolean; help: boolean; panelL: boolean; panelR: boolean;
  modal: null | 'auth' | 'account' | 'share';
}

const UNDO_CAP = 100;

export class Store extends Emitter {
  project: Project = defaultSample();
  rooms: RoomPoly[] = [];
  sel: Selection | null = null;
  user: UserProfile | null = null;
  authLoading = true;
  ui: UIState = { mode: '2d', tool: { type: 'select' }, walking: false, theme: 'dark', ctx: null, hydrated: false, help: false, panelL: true, panelR: true, modal: null };
  version = 0;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private txn: string | null = null;

  constructor() { super(); this.recompute(); }

  emit(ev: EventName, e?: ChangeInfo) {
    this.version++;
    this.fire(ev, e);
  }

  recompute() {
    pruneGroups(this.project);
    this.rooms = detectRooms(this.project.walls);
    for (const r of this.rooms) {
      const meta = this.project.roomMetas.find((m) => pointInPoly(m.anchor, r.poly));
      r.metaId = meta?.id;
    }
  }

  snapshot(): string { return JSON.stringify(this.project); }

  /** 一次性修改并入撤销栈 */
  commit(mut: (p: Project) => void) {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > UNDO_CAP) this.undoStack.shift();
    this.redoStack.length = 0;
    mut(this.project);
    this.recompute();
    this.emit('change');
  }

  /** 连续修改（拖拽/滑杆）：begin → update* → end */
  begin() { if (this.txn === null) this.txn = this.snapshot(); }
  update(mut: (p: Project) => void) {
    mut(this.project);
    this.recompute();
    this.emit('change', { transient: true });
  }
  end() {
    if (this.txn === null) return;
    if (this.txn !== this.snapshot()) {
      this.undoStack.push(this.txn);
      if (this.undoStack.length > UNDO_CAP) this.undoStack.shift();
      this.redoStack.length = 0;
      this.emit('change');
    }
    this.txn = null;
  }

  undo() {
    const s = this.undoStack.pop();
    if (!s) return;
    this.redoStack.push(this.snapshot());
    this.project = JSON.parse(s);
    this.afterRestore();
  }

  redo() {
    const s = this.redoStack.pop();
    if (!s) return;
    this.undoStack.push(this.snapshot());
    this.project = JSON.parse(s);
    this.afterRestore();
  }

  private afterRestore() {
    this.sel = null;
    this.recompute();
    this.emit('sel');
    this.emit('change');
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  /** 整体替换（导入/示例/清空），可撤销 */
  replaceProject(p: Project) {
    this.sel = null;
    this.commit((proj) => Object.assign(proj, p));
    this.emit('sel');
    this.emit('project');
  }

  /** IndexedDB 启动恢复：不入撤销栈 */
  hydrate(p: Project) {
    this.project = p;
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.sel = null;
    this.recompute();
    this.emit('sel');
    this.emit('change', { transient: true });
    this.emit('project');
  }

  setSel(sel: Selection | null) {
    this.sel = sel;
    this.emit('sel');
  }

  setTool(tool: Tool) {
    this.ui.tool = tool;
    this.emit('ui');
  }

  setMode(mode: ViewMode) {
    this.ui.mode = mode;
    if (mode === '2d') this.ui.walking = false;
    this.emit('ui');
  }

  patchUI(p: Partial<UIState>) {
    Object.assign(this.ui, p);
    this.emit('ui');
  }
}

export const store = new Store();

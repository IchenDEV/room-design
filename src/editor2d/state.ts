import type { Guide, Pt } from '../core/types';
import type { ItemResizeCorner } from './item-handles';

export type Drag =
  | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'item'; id: string; off: Pt; moved: boolean }
  | { kind: 'group'; id: string; last: Pt; moved: boolean }
  | { kind: 'item-rotate'; id: string; moved: boolean }
  | { kind: 'item-resize'; id: string; corner: ItemResizeCorner; anchor: Pt; rot: number; moved: boolean }
  | { kind: 'wall'; id: string; last: Pt; moved: boolean }
  | { kind: 'node'; ends: { wallId: string; end: 'a' | 'b' }[]; moved: boolean }
  | { kind: 'opening'; id: string; moved: boolean }
  | { kind: 'ruler' }
  | { kind: 'measure' }
  | { kind: 'boxSelect' };

export interface GhostOpening { wallId: string; t: number; valid: boolean }
export interface RulerMeasure { a: Pt; b: Pt }

export interface EditorState {
  hoverPt: Pt | null;          // 鼠标世界坐标
  chain: Pt[];                 // 画墙锚点链
  chainCur: Pt | null;         // 链当前预览点
  rectA: Pt | null;            // 矩形起点
  rectB: Pt | null;
  ghostOpen: GhostOpening | null;
  ruler: RulerMeasure | null;
  measure: RulerMeasure | null;
  boxSelect: RulerMeasure | null;
  drag: Drag | null;
  guides: Guide[];
  snapped: Pt | null;          // 当前吸附点（高亮）
  snapLabel: string | null;    // 当前吸附说明
}

export const initialState = (): EditorState => ({
  hoverPt: null, chain: [], chainCur: null, rectA: null, rectB: null,
  ghostOpen: null, ruler: null, measure: null, boxSelect: null, drag: null, guides: [], snapped: null, snapLabel: null,
});

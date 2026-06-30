import * as Y from 'yjs';
import { defaultSettings, emptyProject, type Project, type Settings } from '../types';
import { normalizeRenderQuality } from '../renderQuality';

/** Yjs 文档结构：
 *  - name: Y.Text（方案名，支持协同字符级合并）
 *  - settings: Y.Map（全局方案与 3D 渲染设置）
 *  - walls / openings / items / groups / measures / roomMetas: Y.Array<Y.Map>
 *    每个实体为 Y.Map，键即字段名；version 固定为 1，存于 root Map。 */

const ARR_KEYS = ['walls', 'openings', 'items', 'groups', 'measures', 'roomMetas'] as const;
type ArrKey = (typeof ARR_KEYS)[number];

function fillMap(m: Y.Map<unknown>, obj: Record<string, unknown>) {
  for (const [k, v] of Object.entries(obj)) m.set(k, v);
}
function mapToObj(m: Y.Map<unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  m.forEach((v, k) => { o[k] = v; });
  return o;
}

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function readSettings(m: Y.Map<unknown>): Settings {
  const d = defaultSettings();
  return {
    wallHeight: num(m.get('wallHeight'), d.wallHeight),
    wallThickness: num(m.get('wallThickness'), d.wallThickness),
    showCeiling: Boolean(m.get('showCeiling')),
    rayTracing: Boolean(m.get('rayTracing')),
    solidCollision: Boolean(m.get('solidCollision')),
    sunIntensity: num(m.get('sunIntensity'), d.sunIntensity ?? 2.2),
    sunAzimuth: num(m.get('sunAzimuth'), d.sunAzimuth ?? 35),
    sunElevation: num(m.get('sunElevation'), d.sunElevation ?? 52),
    renderQuality: normalizeRenderQuality(m.get('renderQuality')),
    cameraX: m.has('cameraX') ? num(m.get('cameraX'), 700) : undefined,
    cameraY: m.has('cameraY') ? num(m.get('cameraY'), 760) : undefined,
    cameraZ: m.has('cameraZ') ? num(m.get('cameraZ'), 760) : undefined,
  };
}

/** 用 Project 数据填充一个 Y.Doc（清空后重建；Phase 2 单端写入，无合并需求） */
export function seedYDocFromProject(doc: Y.Doc, p: Project): void {
  doc.transact(() => {
    const name = doc.getText('name');
    name.delete(0, name.length);
    name.insert(0, p.name);
    doc.getMap('root').set('version', p.version);

    const s = doc.getMap<unknown>('settings');
    s.clear();
    const sets = { ...defaultSettings(), ...p.settings };
    Object.entries(sets).forEach(([k, v]) => { if (v !== undefined) s.set(k, v); });

    for (const key of ARR_KEYS) {
      const arr = doc.getArray<Y.Map<unknown>>(key as string);
      arr.delete(0, arr.length);
      const list = (p[key] ?? []) as unknown as Record<string, unknown>[];
      for (const entity of list) {
        const m = new Y.Map();
        fillMap(m, entity);
        arr.push([m]);
      }
    }
  });
}

/** 从 Y.Doc 派生 plain Project 镜像 */
export function projectFromYDoc(doc: Y.Doc): Project {
  const proj = emptyProject(doc.getText('name').toString());
  proj.version = 1;
  proj.settings = readSettings(doc.getMap<unknown>('settings'));
  for (const key of ARR_KEYS) {
    const arr = doc.getArray<Y.Map<unknown>>(key as string);
    const list = arr.map(mapToObj);
    if (key === 'groups') proj.groups = list as never;
    else if (key === 'measures') proj.measures = list as never;
    else (proj[key as Exclude<ArrKey, 'groups' | 'measures'>] as never) = list as never;
  }
  return proj;
}

/** Project → Yjs 编码状态（完整快照，便于云端整存） */
export function encodeProjectUpdate(p: Project): Uint8Array {
  const doc = new Y.Doc();
  seedYDocFromProject(doc, p);
  return Y.encodeStateAsUpdate(doc);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let raw = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    raw += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(raw);
}

function bytesFromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesFromBase64(text: string): Uint8Array | null {
  try {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function bytesFromBytea(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return new Uint8Array(value);
  if (typeof value === 'string') {
    if (!value) return null;
    if (value.startsWith('\\x')) return bytesFromHex(value.slice(2));
    return bytesFromBase64(value);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [Number(k), Number(v)] as const)
      .filter(([k, v]) => Number.isInteger(k) && Number.isInteger(v))
      .sort(([a], [b]) => a - b);
    if (entries.length) return new Uint8Array(entries.map(([, v]) => v));
  }
  return null;
}

/** Yjs 编码状态 → Project（损坏或空数据返回 null） */
export function decodeProjectUpdate(bytes: Uint8Array | null): Project | null {
  if (!bytes || bytes.length === 0) return null;
  try {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, bytes);
    return projectFromYDoc(doc);
  } catch { return null; }
}

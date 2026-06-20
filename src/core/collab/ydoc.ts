import * as Y from 'yjs';
import type { Project, Settings } from '../types';
import { defaultSettings, emptyProject } from '../types';

/** Yjs 文档结构：
 *  - name: Y.Text（方案名，支持协同字符级合并）
 *  - settings: Y.Map（wallHeight / wallThickness / showCeiling）
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

/** 用 Project 数据填充一个 Y.Doc（清空后重建；Phase 2 单端写入，无合并需求） */
export function seedYDocFromProject(doc: Y.Doc, p: Project): void {
  doc.transact(() => {
    const name = doc.getText('name');
    name.delete(0, name.length);
    name.insert(0, p.name);
    doc.getMap('root').set('version', p.version);

    const s = doc.getMap<unknown>('settings');
    s.clear();
    const sets = p.settings ?? defaultSettings();
    s.set('wallHeight', sets.wallHeight);
    s.set('wallThickness', sets.wallThickness);
    s.set('showCeiling', sets.showCeiling);

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
  const settingsMap = doc.getMap<unknown>('settings');
  const settings: Settings = {
    wallHeight: Number(settingsMap.get('wallHeight')) || 280,
    wallThickness: Number(settingsMap.get('wallThickness')) || 20,
    showCeiling: Boolean(settingsMap.get('showCeiling')),
  };
  const proj = emptyProject(doc.getText('name').toString());
  proj.version = 1;
  proj.settings = settings;
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

/** Yjs 编码状态 → Project（损坏或空数据返回 null） */
export function decodeProjectUpdate(bytes: Uint8Array | null): Project | null {
  if (!bytes || bytes.length === 0) return null;
  try {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, bytes);
    return projectFromYDoc(doc);
  } catch { return null; }
}

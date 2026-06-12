import type { Store } from './store';
import type { Item, ItemGroup, Project, Selection } from '../types';
import { uid } from '../types';

export const ensureGroups = (p: Project): ItemGroup[] => (p.groups ??= []);

export function pruneGroups(p: Project) {
  const valid = new Set(p.items.map((i) => i.id));
  p.groups = ensureGroups(p)
    .map((g) => ({ ...g, itemIds: [...new Set(g.itemIds)].filter((id) => valid.has(id)) }))
    .filter((g) => g.itemIds.length > 1);
}

export const groupOf = (s: Store, id: string): ItemGroup | undefined => ensureGroups(s.project).find((g) => g.id === id);

export const itemGroupId = (p: Project, itemId: string): string | null =>
  ensureGroups(p).find((g) => g.itemIds.includes(itemId))?.id ?? null;

export const groupItems = (s: Store, id: string): Item[] => {
  const g = groupOf(s, id);
  return g ? g.itemIds.map((gid) => s.project.items.find((i) => i.id === gid)).filter(Boolean) as Item[] : [];
};

export function idsFromSelection(s: Store, sel: Selection | null = s.sel): string[] {
  if (!sel) return [];
  if (sel.kind === 'item') return [sel.id];
  if (sel.kind === 'multi') return sel.ids;
  if (sel.kind === 'group') return groupOf(s, sel.id)?.itemIds ?? [];
  return [];
}

export function toggleItemSelection(s: Store, id: string) {
  const cur = idsFromSelection(s).filter((x) => x !== id);
  const ids = idsFromSelection(s).includes(id) ? cur : [...cur, id];
  s.setSel(ids.length > 1 ? { kind: 'multi', ids } : ids[0] ? { kind: 'item', id: ids[0] } : null);
}

export function createGroupFromSelection(s: Store) {
  const ids = [...new Set(idsFromSelection(s))];
  if (ids.length < 2) return;
  const id = uid('g');
  s.commit((p) => {
    const groups = ensureGroups(p);
    for (const g of groups) g.itemIds = g.itemIds.filter((x) => !ids.includes(x));
    groups.push({ id, name: `组合${groups.length + 1}`, itemIds: ids });
    pruneGroups(p);
  });
  s.setSel({ kind: 'group', id });
}

export function ungroupSelection(s: Store) {
  if (s.sel?.kind !== 'group') return;
  const id = s.sel.id;
  s.commit((p) => { p.groups = ensureGroups(p).filter((g) => g.id !== id); });
  s.setSel(null);
}

export function duplicateGroup(s: Store, id: string) {
  const src = groupItems(s, id);
  if (!src.length) return;
  const gid = uid('g');
  const name = groupOf(s, id)?.name ?? '组合';
  s.commit((p) => {
    const idMap = new Map<string, string>();
    for (const it of src) {
      const nid = uid('i');
      idMap.set(it.id, nid);
      p.items.push({ ...it, id: nid, x: it.x + 30, y: it.y - 30 });
    }
    ensureGroups(p).push({ id: gid, name: `${name} 副本`, itemIds: src.map((i) => idMap.get(i.id)!) });
  });
  s.setSel({ kind: 'group', id: gid });
}

export function setGroupName(s: Store, id: string, name: string) {
  s.commit((p) => {
    const g = ensureGroups(p).find((x) => x.id === id);
    if (g) g.name = name;
  });
}

export function moveItems(p: Project, ids: string[], dx: number, dy: number) {
  const set = new Set(ids);
  for (const it of p.items) if (set.has(it.id)) { it.x += dx; it.y += dy; }
}

import type { Store } from './store';
import { emptyProject, uid } from '../types';
import type { Project } from '../types';
import { idbDel, idbGet, idbSet } from './idb';

const INDEX = 'project:index';
const LEGACY = 'project:current';

export interface ProjectFileMeta { id: string; name: string; updatedAt: number }
interface ProjectIndex { activeId: string; files: ProjectFileMeta[] }

export const projectFileState = { activeId: '', files: [] as ProjectFileMeta[] };

export function isValidProject(p: unknown): p is Project {
  const x = p as Project;
  return !!x && x.version === 1 && Array.isArray(x.walls) && Array.isArray(x.openings)
    && Array.isArray(x.items) && Array.isArray(x.roomMetas) && !!x.settings;
}

const pkey = (id: string) => `project:${id}`;
const now = () => Date.now();
const clone = (p: Project): Project => JSON.parse(JSON.stringify(p));
const index = (): ProjectIndex => ({ activeId: projectFileState.activeId, files: projectFileState.files });

function acceptIndex(x: unknown): x is ProjectIndex {
  const i = x as ProjectIndex;
  return !!i && typeof i.activeId === 'string' && Array.isArray(i.files)
    && i.files.every((f) => f && typeof f.id === 'string' && typeof f.name === 'string'
      && typeof f.updatedAt === 'number');
}

async function readProject(id: string): Promise<Project | null> {
  const raw = await idbGet<string>(pkey(id));
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return isValidProject(p) ? p : null;
  } catch { return null; }
}

export const projectFiles = () => projectFileState.files;
export const activeProjectFile = () =>
  projectFileState.files.find((f) => f.id === projectFileState.activeId) ?? null;

export async function saveProjectFile(store: Store, emitSaved = true) {
  const meta = activeProjectFile();
  if (!meta) return;
  meta.name = store.project.name || '未命名方案';
  meta.updatedAt = now();
  await idbSet(pkey(meta.id), store.snapshot());
  await idbSet(INDEX, index());
  if (emitSaved) store.emit('saved');
}

export async function initProjectFiles(store: Store) {
  let idx: ProjectIndex | undefined;
  try {
    const raw = await idbGet<ProjectIndex>(INDEX);
    if (acceptIndex(raw)) idx = raw;
  } catch { /* ignore damaged index */ }
  if (!idx) {
    const legacy = await readLegacyProject(store.project);
    const id = uid('file');
    idx = { activeId: id, files: [{ id, name: legacy.name || '未命名方案', updatedAt: now() }] };
    projectFileState.activeId = id; projectFileState.files = idx.files;
    store.hydrate(legacy);
    await saveProjectFile(store, false);
    return;
  }
  projectFileState.activeId = idx.activeId;
  projectFileState.files = idx.files;
  const meta = activeProjectFile() ?? idx.files[0];
  const p = meta ? await readProject(meta.id) : null;
  if (meta) projectFileState.activeId = meta.id;
  store.hydrate(p ?? store.project);
  await saveProjectFile(store, false);
}

async function readLegacyProject(fallback: Project): Promise<Project> {
  try {
    const raw = await idbGet<string>(LEGACY);
    if (raw) {
      const p = JSON.parse(raw);
      if (isValidProject(p)) return p;
    }
  } catch { /* ignore */ }
  return fallback;
}

export function bindProjectFilePersistence(store: Store) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  store.on('change', (e) => {
    if (e?.transient) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; saveProjectFile(store).catch(() => {}); }, 300);
  });
}

export async function createProjectFile(store: Store) {
  await saveProjectFile(store, false);
  const name = `方案 ${projectFileState.files.length + 1}`;
  await addProjectAsFile(store, emptyProject(name));
}

export async function duplicateProjectFile(store: Store) {
  await saveProjectFile(store, false);
  const p = clone(store.project);
  p.name = `${p.name || '未命名方案'} 副本`;
  await addProjectAsFile(store, p);
}

export async function addProjectAsFile(store: Store, p: Project) {
  const id = uid('file');
  projectFileState.files.push({ id, name: p.name || '未命名方案', updatedAt: now() });
  projectFileState.activeId = id;
  store.hydrate(clone(p));
  await saveProjectFile(store);
  store.emit('ui');
}

export async function switchProjectFile(store: Store, id: string): Promise<string | null> {
  if (id === projectFileState.activeId) return null;
  await saveProjectFile(store, false);
  const p = await readProject(id);
  if (!p) return '文件数据损坏或不存在';
  projectFileState.activeId = id;
  store.hydrate(p);
  await saveProjectFile(store, false);
  store.emit('ui');
  return null;
}

export async function deleteProjectFile(store: Store, id: string): Promise<string | null> {
  if (projectFileState.files.length <= 1) return '至少保留一个方案文件';
  const next = projectFileState.files.find((f) => f.id !== id);
  projectFileState.files = projectFileState.files.filter((f) => f.id !== id);
  await idbDel(pkey(id));
  if (id === projectFileState.activeId && next) {
    projectFileState.activeId = next.id;
    store.hydrate((await readProject(next.id)) ?? emptyProject(next.name));
  }
  await idbSet(INDEX, index());
  store.emit('ui');
  return null;
}

import type { Store } from './store';
import { emptyProject, type Project } from '../types';
import {
  projectFileState, activeProjectFile, projectFiles, isValidProject,
  saveProjectFile as saveLocal, initProjectFiles as initLocal,
  bindProjectFilePersistence as bindLocal, addProjectAsFile as addLocal,
  createProjectFile as createLocal, duplicateProjectFile as dupLocal,
  switchProjectFile as switchLocal, deleteProjectFile as delLocal,
  type ProjectFileMeta,
} from './project-files';
import {
  listCloudProjects, createCloudProject, getCloudProject, saveCloudProject, deleteCloudProject,
} from '../cloud/projects';
import { isCloudActive, setSync } from '../collab/sync-status';
import { toastErr } from '../../ui/toast';

export { projectFileState, activeProjectFile, projectFiles, isValidProject, type ProjectFileMeta };

const toMeta = (c: { id: string; name: string; ownerId: string; updatedAt: string; role: any }): ProjectFileMeta => ({
  id: c.id, name: c.name, cloudId: c.id, ownerId: c.ownerId,
  updatedAt: new Date(c.updatedAt).getTime(), role: c.role,
});
const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export async function initProjectFiles(s: Store): Promise<void> {
  if (isCloudActive()) {
    try {
      const cloud = await listCloudProjects();
      if (!cloud.length) { await migrateLocalToCloud(s); return; }
      projectFileState.files = cloud.map(toMeta);
      projectFileState.activeId = cloud[0].id;
      s.hydrate((await getCloudProject(cloud[0].id)) ?? emptyProject(cloud[0].name));
      setSync('synced');
    } catch (e) {
      toastErr(`云端加载失败：${msg(e)}`); setSync('error', msg(e)); await initLocal(s);
    }
    return;
  }
  await initLocal(s);
  setSync('local');
}

/** 首次登录：把本地 IndexedDB 方案批量迁移上云 */
async function migrateLocalToCloud(s: Store): Promise<void> {
  const local = [...projectFileState.files];
  if (!local.length) {
    const c = await createCloudProject('新方案');
    projectFileState.files = [toMeta({ ...c, role: 'owner' })];
    projectFileState.activeId = c.id;
    s.hydrate(emptyProject(c.name));
    setSync('synced');
    return;
  }
  const metas: ProjectFileMeta[] = [];
  for (const lf of local) {
    try {
      const meta = await createCloudProject(lf.name);
      metas.push(toMeta({ ...meta, role: 'owner' }));
    } catch (e) { toastErr(`迁移「${lf.name}」失败：${msg(e)}`); }
  }
  if (metas.length) {
    projectFileState.files = metas;
    projectFileState.activeId = metas[0].id;
    const p = (await getCloudProject(metas[0].id)) ?? emptyProject(metas[0].name);
    s.hydrate(p);
    setSync('synced');
  }
}

export async function switchProjectFile(s: Store, id: string): Promise<string | null> {
  if (!isCloudActive()) return switchLocal(s, id);
  try {
    setSync('syncing');
    const p = await getCloudProject(id);
    if (!p) return '云端文件数据损坏或不存在';
    projectFileState.activeId = id;
    s.hydrate(p);
    setSync('synced');
    s.emit('ui');
    return null;
  } catch (e) { setSync('error', msg(e)); return msg(e); }
}

export async function createProjectFile(s: Store): Promise<void> {
  if (!isCloudActive()) return createLocal(s);
  const c = await createCloudProject(`方案 ${projectFileState.files.length + 1}`);
  projectFileState.files.unshift(toMeta({ ...c, role: 'owner' }));
  projectFileState.activeId = c.id;
  s.hydrate(emptyProject(c.name));
  setSync('synced');
  s.emit('ui');
}

export async function duplicateProjectFile(s: Store): Promise<void> {
  if (!isCloudActive()) return dupLocal(s);
  const c = await createCloudProject(`${s.project.name} 副本`, s.project);
  projectFileState.files.unshift(toMeta({ ...c, role: 'owner' }));
  projectFileState.activeId = c.id;
  setSync('synced');
  s.emit('ui');
}

export async function addProjectAsFile(s: Store, p: Project): Promise<void> {
  if (!isCloudActive()) return addLocal(s, p);
  const c = await createCloudProject(p.name || '未命名方案', p);
  projectFileState.files.unshift(toMeta({ ...c, role: 'owner' }));
  projectFileState.activeId = c.id;
  s.hydrate(JSON.parse(JSON.stringify(p)));
  setSync('synced');
  s.emit('ui');
}

export async function deleteProjectFile(s: Store, id: string): Promise<string | null> {
  if (!isCloudActive()) return delLocal(s, id);
  const meta = projectFileState.files.find((f) => f.id === id);
  if (meta?.role === 'owner') await deleteCloudProject(id);
  projectFileState.files = projectFileState.files.filter((f) => f.id !== id);
  if (id === projectFileState.activeId && projectFileState.files[0]) {
    return switchProjectFile(s, projectFileState.files[0].id);
  }
  s.emit('ui');
  return null;
}

export async function saveProjectFile(s: Store, emitSaved = true): Promise<void> {
  if (!isCloudActive()) return saveLocal(s, emitSaved);
  const meta = activeProjectFile();
  if (!meta?.cloudId) return;
  try {
    await saveCloudProject(meta.cloudId, s.project);
    meta.name = s.project.name;
    meta.updatedAt = Date.now();
    if (emitSaved) s.emit('saved');
    setSync('synced');
  } catch (e) { setSync('error', msg(e)); throw e; }
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null;
export function bindProjectFilePersistence(s: Store): void {
  bindLocal(s);
  s.on('change', (e) => {
    if (e?.transient || !isCloudActive()) return;
    if (cloudTimer) clearTimeout(cloudTimer);
    setSync('syncing');
    cloudTimer = setTimeout(() => { cloudTimer = null; saveProjectFile(s).catch(() => {}); }, 1000);
  });
}



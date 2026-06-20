import { supabase } from '../supabase/client';
import { bytesFromBytea, decodeProjectUpdate, encodeProjectUpdate } from '../collab/ydoc';
import type { Project } from '../types';

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

const T = 'project_snapshots';

export async function listSnapshots(projectId: string): Promise<Snapshot[]> {
  const { data, error } = await supabase
    .from(T).select('id,name,created_at,created_by')
    .eq('project_id', projectId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name, createdAt: r.created_at, createdBy: r.created_by,
  }));
}

export async function createSnapshot(projectId: string, name: string, p: Project): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from(T)
    .insert({ project_id: projectId, name, ydoc: encodeProjectUpdate(p), created_by: u.user!.id });
  if (error) throw error;
}

export async function loadSnapshot(snapshotId: string): Promise<Project | null> {
  const { data, error } = await supabase.from(T).select('ydoc').eq('id', snapshotId).maybeSingle();
  if (error) throw error;
  return decodeProjectUpdate(bytesFromBytea(data?.ydoc));
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  const { error } = await supabase.from(T).delete().eq('id', snapshotId);
  if (error) throw error;
}

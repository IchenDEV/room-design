import { supabase } from '../supabase/client';
import type { Project } from '../types';
import { emptyProject } from '../types';
import { bytesFromBytea, bytesToBase64, decodeProjectUpdate, encodeProjectUpdate } from '../collab/ydoc';

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface CloudProjectMeta {
  id: string;
  name: string;
  ownerId: string;
  updatedAt: string;
  role: MemberRole;
}

export interface CloudMember {
  userId: string;
  role: MemberRole;
  email: string;
  displayName: string;
}

const T = 'projects';
const MT = 'project_members';

function row(p: any): CloudProjectMeta {
  return {
    id: p.id, name: p.name, ownerId: p.owner_id,
    updatedAt: p.updated_at,
    role: p.role ?? 'editor',
  };
}

/** 列出我能访问的云端方案（含我的成员角色） */
export async function listCloudProjects(): Promise<CloudProjectMeta[]> {
  const { data, error } = await supabase
    .from(T).select('id,name,owner_id,updated_at,role:project_members(role)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => row({ ...r, role: Array.isArray(r.role) ? r.role[0]?.role : r.role }));
}

/** 新建云端方案，owner 自动加入 project_members */
export async function createCloudProject(name: string, p?: Project): Promise<CloudProjectMeta> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('未登录');
  const seed: Project = p ? { ...p, name } : emptyProject(name);
  const { data, error } = await supabase.rpc('create_project', {
    p_name: name,
    p_ydoc_base64: bytesToBase64(encodeProjectUpdate(seed)),
  }).single();
  if (error) throw error;
  return row(data);
}

/** 读取云端方案（解码 ydoc → Project） */
export async function getCloudProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from(T).select('ydoc').eq('id', id).maybeSingle();
  if (error) throw error;
  return decodeProjectUpdate(bytesFromBytea(data?.ydoc));
}

/** 整体覆盖云端 ydoc（Phase 2 单端写入） */
export async function saveCloudProject(id: string, p: Project): Promise<void> {
  const { error } = await supabase.rpc('save_project', {
    p_project_id: id,
    p_name: p.name,
    p_ydoc_base64: bytesToBase64(encodeProjectUpdate(p)),
  });
  if (error) throw error;
}

export async function renameCloudProject(id: string, name: string): Promise<void> {
  const { error } = await supabase.from(T).update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteCloudProject(id: string): Promise<void> {
  const { error } = await supabase.from(T).delete().eq('id', id);
  if (error) throw error;
}

export async function listCloudMembers(projectId: string): Promise<CloudMember[]> {
  const { data, error } = await supabase
    .from(MT).select('user_id,role').eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    userId: m.user_id, role: m.role, email: '', displayName: '',
  }));
}

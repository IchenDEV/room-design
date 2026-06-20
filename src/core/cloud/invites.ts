import { supabase } from '../supabase/client';

export interface Invite {
  id: string;
  token: string;
  role: 'editor' | 'viewer';
  createdAt: string;
  expiresAt: string | null;
  uses: number;
  maxUses: number | null;
}

export interface InviteMember {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

const IT = 'project_invites';
const MT = 'project_members';

export async function listInvites(projectId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from(IT).select('id,token,role,created_at,expires_at,uses,max_uses')
    .eq('project_id', projectId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, token: r.token, role: r.role, createdAt: r.created_at,
    expiresAt: r.expires_at, uses: r.uses, maxUses: r.max_uses,
  }));
}

export async function createInvite(projectId: string, role: 'editor' | 'viewer'): Promise<Invite> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(IT).insert({ project_id: projectId, role, created_by: u.user!.id })
    .select('id,token,role,created_at,expires_at,uses,max_uses').single();
  if (error) throw error;
  return { id: data.id, token: data.token, role: data.role, createdAt: data.created_at,
    expiresAt: data.expires_at, uses: data.uses, maxUses: data.max_uses };
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from(IT).delete().eq('id', inviteId);
  if (error) throw error;
}

export async function listInviteMembers(projectId: string): Promise<InviteMember[]> {
  const { data, error } = await supabase.from(MT).select('user_id,role').eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({ userId: m.user_id, role: m.role }));
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from(MT).delete()
    .eq('project_id', projectId).eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberRole(projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<void> {
  const { error } = await supabase.from(MT).update({ role })
    .eq('project_id', projectId).eq('user_id', userId);
  if (error) throw error;
}

/** 用邀请 token 兑换项目访问权（security definer RPC），返回 projectId */
export async function redeemInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_invite', { p_token: token });
  if (error) throw error;
  return data as string;
}

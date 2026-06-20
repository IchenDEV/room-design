import { useEffect, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { activeProjectFile } from '../core/store/files';
import {
  listInvites, createInvite, revokeInvite, listInviteMembers, removeMember, updateMemberRole,
  type Invite, type InviteMember,
} from '../core/cloud/invites';
import { isCloudActive } from '../core/collab/sync-status';
import { toastErr, toastOk } from './toast';
import { Ic } from './icons';

const inviteUrl = (token: string) => `${location.origin}/#/i/${encodeURIComponent(token)}`;

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch { /* fall back to textarea copy */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export function ShareModal() {
  useTick();
  if (store.ui.modal !== 'share') return null;
  if (!isCloudActive()) return null;
  const meta = activeProjectFile();
  if (!meta?.cloudId) return null;
  return <ShareBody projectId={meta.cloudId} ownerId={meta.ownerId} />;
}

function ShareBody({ projectId, ownerId }: { projectId: string; ownerId?: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<InviteMember[]>([]);
  const [busy, setBusy] = useState(false);
  const close = () => store.patchUI({ modal: null });

  const refresh = async () => {
    try {
      setInvites(await listInvites(projectId));
      setMembers(await listInviteMembers(projectId));
    } catch (e) { toastErr(msg(e)); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [projectId]);

  const makeInvite = async (role: 'editor' | 'viewer') => {
    setBusy(true);
    try {
      const inv = await createInvite(projectId, role);
      await copyText(inviteUrl(inv.token));
      toastOk(`已复制${role === 'editor' ? '可编辑' : '只读'}邀请链接`);
      refresh();
    } catch (e) { toastErr(msg(e)); } finally { setBusy(false); }
  };
  const copyInvite = async (token: string) => {
    try { await copyText(inviteUrl(token)); toastOk('邀请链接已复制'); }
    catch (e) { toastErr(msg(e)); }
  };
  const revoke = async (id: string) => {
    try { await revokeInvite(id); refresh(); toastOk('已撤销链接'); } catch (e) { toastErr(msg(e)); }
  };
  const kick = async (uid: string) => {
    try { await removeMember(projectId, uid); refresh(); } catch (e) { toastErr(msg(e)); }
  };
  const setRole = async (uid: string, role: 'editor' | 'viewer') => {
    try { await updateMemberRole(projectId, uid, role); refresh(); } catch (e) { toastErr(msg(e)); }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>分享与协作</b>
          <button className="tb-btn" title="关闭" onClick={close}><Ic n="close" /></button>
        </div>
        <div className="modal-body">
          <label className="prop-label">生成邀请链接</label>
          <div className="btn-row">
            <button className="btn auth-primary" disabled={busy} onClick={() => makeInvite('editor')}>
              <Ic n="edit" size={14} />可编辑链接
            </button>
            <button className="btn" disabled={busy} onClick={() => makeInvite('viewer')}>
              <Ic n="cube" size={14} />只读链接
            </button>
          </div>

          {invites.length > 0 && (
            <>
              <label className="prop-label">活跃邀请</label>
              <div className="invite-list">
                {invites.map((iv) => (
                  <div key={iv.id} className="invite-row">
                    <span className={`invite-role ${iv.role}`}>{iv.role === 'editor' ? '可编辑' : '只读'}</span>
                    <span className="invite-uses">已用 {iv.uses}{iv.maxUses ? `/${iv.maxUses}` : ''} 次</span>
                    <button className="dd-item" onClick={() => copyInvite(iv.token)} title="复制链接">
                      <Ic n="copy" size={13} />
                    </button>
                    <button className="dd-item danger" onClick={() => revoke(iv.id)}><Ic n="trash" size={13} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          <label className="prop-label">协作成员（{members.length}）</label>
          <div className="invite-list">
            {members.map((m) => (
              <div key={m.userId} className="invite-row">
                <span className="invite-uid">{m.userId.slice(0, 8)}</span>
                {m.role === 'owner' ? (
                  <span className="invite-role owner">所有者</span>
                ) : (
                  <>
                    <select className="role-select" value={m.role}
                      onChange={(e) => setRole(m.userId, e.target.value as 'editor' | 'viewer')}>
                      <option value="editor">可编辑</option>
                      <option value="viewer">只读</option>
                    </select>
                    <button className="dd-item danger" onClick={() => kick(m.userId)} title="移除">
                      <Ic n="trash" size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="auth-note">受邀者打开链接后将自动加入项目，可实时协同编辑。</p>
        </div>
      </div>
    </div>
  );
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

import { useTick } from '../core/store/react';
import { getPresence } from '../core/collab/awareness';
import { isCloudActive } from '../core/collab/sync-status';

export function PresenceBar() {
  useTick();
  if (!isCloudActive()) return null;
  const list = getPresence();
  if (!list.length) return null;
  return (
    <div className="presence-bar" title={`在线协作者：${list.map((u) => u.name).join('、')}`}>
      {list.slice(0, 5).map((u) => {
        const initial = (u.name || '?').trim().charAt(0).toUpperCase();
        return (
          <span key={u.id} className="presence-chip" style={{ background: u.color }}
            title={u.name}>
            {initial}
          </span>
        );
      })}
      {list.length > 5 && <span className="presence-more">+{list.length - 5}</span>}
    </div>
  );
}

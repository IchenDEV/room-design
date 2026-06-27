import type { AiChatSession } from '../../core/ai/chat';
import { Ic } from '../icons';

const fmt = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

interface Props {
  sessions: AiChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function AiHistory({ sessions, activeId, onSelect, onNew, onDelete, onClear }: Props) {
  return (
    <section className="ai-history" aria-label="AI 历史对话">
      <div className="ai-history-actions">
        <button type="button" onClick={onNew}><Ic n="edit" size={13} />新对话</button>
        <button type="button" onClick={onClear}><Ic n="trash" size={13} />清空</button>
      </div>
      <div className="ai-history-list">
        {sessions.map((s) => <HistoryRow key={s.id} s={s} active={s.id === activeId}
          onSelect={onSelect} onDelete={onDelete} />)}
      </div>
    </section>
  );
}

function HistoryRow({
  s, active, onSelect, onDelete,
}: { s: AiChatSession; active: boolean; onSelect: Props['onSelect']; onDelete: Props['onDelete'] }) {
  const last = s.messages[s.messages.length - 1]?.text || '暂无消息';
  return (
    <article className={`ai-history-row ${active ? 'on' : ''}`}>
      <button type="button" className="ai-history-main" onClick={() => onSelect(s.id)}>
        <b>{s.title}</b>
        <span>{last}</span>
        <small>{fmt.format(s.updatedAt)} · {s.messages.length} 条</small>
      </button>
      <button type="button" className="ai-history-del" aria-label={`删除${s.title}`} onClick={() => onDelete(s.id)}>
        <Ic n="close" size={13} />
      </button>
    </article>
  );
}

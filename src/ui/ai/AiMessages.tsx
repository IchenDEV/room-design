import type { AiChatMessage, AiChatSession } from '../../core/ai/chat';

const fmt = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' });

export function AiMessages({ session }: { session: AiChatSession }) {
  if (!session.messages.length) {
    return <section className="ai-empty" aria-live="polite">从一句需求开始设计。</section>;
  }
  return (
    <section className="ai-chat-log" aria-label="AI 设计对话" aria-live="polite">
      {session.messages.map((m) => <Message key={m.id} msg={m} />)}
    </section>
  );
}

function Message({ msg }: { msg: AiChatMessage }) {
  const who = msg.role === 'assistant' ? 'AI' : '你';
  return (
    <article className={`ai-msg ${msg.role}`}>
      <header className="ai-msg-head">
        <b>{who}</b>
        <time dateTime={new Date(msg.createdAt).toISOString()}>{fmt.format(msg.createdAt)}</time>
      </header>
      <p>{msg.text}</p>
      {!!msg.images?.length && <span className="ai-msg-meta">参考图：{msg.images.join('、')}</span>}
      {!!msg.changes?.length && (
        <ul>{msg.changes.map((c) => <li key={c}>{c}</li>)}</ul>
      )}
      {msg.model && <span className="ai-msg-meta">模型：{msg.model}</span>}
    </article>
  );
}

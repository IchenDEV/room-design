import { useState } from 'react';
import { store } from '../../core/store/store';
import { useTick } from '../../core/store/react';
import { stats } from '../../core/store/selectors';
import { requestAiDesign } from '../../core/ai/design';
import { type AiReferenceImage } from '../../core/ai/images';
import {
  loadAiChats, makeAiMessage, newAiSession, saveAiChats, withAiMessages,
  type AiChatState,
} from '../../core/ai/chat';
import { toastErr, toastOk } from '../toast';
import { AiComposer } from './AiComposer';
import { AiHistory } from './AiHistory';
import { AiMessages } from './AiMessages';

const DEFAULT_PROMPT = '把当前方案改成适合两人居住的温馨小家，补齐收纳和灯光';

export function AiPanel() {
  useTick();
  const [chat, setChat] = useState<AiChatState>(() => loadAiChats());
  const [mode, setMode] = useState<'chat' | 'history'>('chat');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [images, setImages] = useState<AiReferenceImage[]>([]);
  const [busy, setBusy] = useState(false);
  const s = stats(store);
  const active = chat.sessions.find((x) => x.id === chat.activeId) ?? chat.sessions[0];

  const commit = (next: AiChatState) => { saveAiChats(next); setChat(next); };
  const startNew = () => {
    const session = newAiSession();
    commit({ activeId: session.id, sessions: [session, ...chat.sessions].slice(0, 20) });
    setMode('chat');
    setPrompt(DEFAULT_PROMPT);
  };
  const selectSession = (id: string) => { commit({ ...chat, activeId: id }); setMode('chat'); };
  const deleteSession = (id: string) => {
    const sessions = chat.sessions.filter((x) => x.id !== id);
    const next = sessions.length ? sessions : [newAiSession()];
    commit({ activeId: id === chat.activeId ? next[0].id : chat.activeId, sessions: next });
  };
  const clearHistory = () => {
    const session = newAiSession();
    commit({ activeId: session.id, sessions: [session] });
    setMode('chat');
  };

  const generate = async () => {
    const text = prompt.trim();
    if (busy) return;
    if (!text) { toastErr('先写一句设计需求'); return; }
    const prior = active.messages;
    const userMsg = makeAiMessage('user', text, { images: images.map((img) => img.name) });
    const pending = withAiMessages(chat, active.id, [userMsg], text);
    commit(pending);
    setBusy(true);
    try {
      const next = await requestAiDesign(store, text, images, prior);
      const answer = makeAiMessage('assistant', next.summary || '已生成新方案', {
        changes: next.changes,
        model: next.model,
      });
      commit(withAiMessages(pending, active.id, [answer], text));
      setPrompt('');
      toastOk('AI 已继续调整并导入新的方案描述文件');
    } catch (e) {
      toastErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-panel">
      <section className="ai-summary" aria-label="AI 设计上下文">
        <Metric k="房间" v={`${s.rooms}`} /><Metric k="面积" v={`${s.area.toFixed(1)}㎡`} /><Metric k="家具" v={`${s.items}`} />
      </section>
      <div className="ai-modebar" role="group" aria-label="AI 面板视图">
        <button type="button" className={mode === 'chat' ? 'on' : ''} aria-pressed={mode === 'chat'} onClick={() => setMode('chat')}>对话</button>
        <button type="button" className={mode === 'history' ? 'on' : ''} aria-pressed={mode === 'history'} onClick={() => setMode('history')}>历史</button>
      </div>
      {mode === 'history' ? (
        <AiHistory sessions={chat.sessions} activeId={chat.activeId} onSelect={selectSession}
          onNew={startNew} onDelete={deleteSession} onClear={clearHistory} />
      ) : (
        <>
          <AiMessages session={active} />
          <AiComposer prompt={prompt} setPrompt={setPrompt} images={images}
            setImages={setImages} busy={busy} onSubmit={generate} />
        </>
      )}
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return <div className="ai-metric"><span>{k}</span><b>{v}</b></div>;
}

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  text: string;
  createdAt: number;
  images?: string[];
  changes?: string[];
  model?: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AiChatMessage[];
}

export interface AiChatState { activeId: string; sessions: AiChatSession[] }

const KEY = 'qiju-ai-chats-v1';
const MAX_SESSIONS = 20;
const MAX_MESSAGES = 40;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => Date.now();

export const makeAiMessage = (
  role: AiChatRole,
  text: string,
  extra: Partial<Omit<AiChatMessage, 'id' | 'role' | 'text' | 'createdAt'>> = {},
): AiChatMessage => ({ id: uid(), role, text, createdAt: now(), ...extra });

export const newAiSession = (title = '新的设计对话'): AiChatSession => ({
  id: uid(),
  title,
  createdAt: now(),
  updatedAt: now(),
  messages: [],
});

export function titleFromPrompt(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 18) : '新的设计对话';
}

function cleanMessage(m: AiChatMessage): AiChatMessage | null {
  if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.text !== 'string') return null;
  return {
    id: String(m.id || uid()),
    role: m.role,
    text: m.text.slice(0, 2000),
    createdAt: Number(m.createdAt) || now(),
    images: Array.isArray(m.images) ? m.images.slice(0, 4).map(String) : undefined,
    changes: Array.isArray(m.changes) ? m.changes.slice(0, 8).map(String) : undefined,
    model: m.model ? String(m.model) : undefined,
  };
}

function cleanSession(s: AiChatSession): AiChatSession | null {
  if (!s || !Array.isArray(s.messages)) return null;
  const messages = s.messages.map(cleanMessage).filter(Boolean) as AiChatMessage[];
  return {
    id: String(s.id || uid()),
    title: String(s.title || '设计对话').slice(0, 30),
    createdAt: Number(s.createdAt) || now(),
    updatedAt: Number(s.updatedAt) || now(),
    messages: messages.slice(-MAX_MESSAGES),
  };
}

export function loadAiChats(): AiChatState {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as AiChatState : null;
    const sessions = (parsed?.sessions ?? []).map(cleanSession).filter(Boolean) as AiChatSession[];
    if (sessions.length) {
      const activeId = sessions.some((s) => s.id === parsed?.activeId) ? parsed!.activeId : sessions[0].id;
      return { activeId, sessions: sessions.slice(0, MAX_SESSIONS) };
    }
  } catch { /* ignore corrupted local history */ }
  const fresh = newAiSession();
  return { activeId: fresh.id, sessions: [fresh] };
}

export function saveAiChats(state: AiChatState) {
  const sessions = state.sessions.slice(0, MAX_SESSIONS);
  localStorage.setItem(KEY, JSON.stringify({ ...state, sessions }));
}

export function withAiMessages(state: AiChatState, sessionId: string, messages: AiChatMessage[], titleHint?: string) {
  const sessions = state.sessions.map((s) => {
    if (s.id !== sessionId) return s;
    const title = s.messages.length ? s.title : titleFromPrompt(titleHint || messages[0]?.text || s.title);
    return { ...s, title, updatedAt: now(), messages: [...s.messages, ...messages].slice(-MAX_MESSAGES) };
  });
  return { activeId: sessionId, sessions };
}

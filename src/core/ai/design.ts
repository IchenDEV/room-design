import type { Project } from '../types';
import type { Store } from '../store/store';
import { CATALOG } from '../catalog/catalog';
import { importProjectText } from '../io';
import type { AiChatMessage } from './chat';
import type { AiReferenceImage } from './images';

export interface AiDesignResult { project: Project; summary: string; changes: string[]; model?: string }

const catalogPayload = () => CATALOG.map((d) => ({
  id: d.id, name: d.name, cat: d.cat, kind: d.kind, w: d.w, d: d.d,
  h: d.h, color: d.color, texture: d.texture, surfaceZ: d.surfaceZ,
}));

export async function requestAiDesign(
  store: Store,
  prompt: string,
  images: AiReferenceImage[] = [],
  history: AiChatMessage[] = [],
): Promise<AiDesignResult> {
  const res = await fetch('/api/ai-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      project: store.project,
      catalog: catalogPayload(),
      images: images.map(({ name, mediaType, dataUrl, size }) => ({ name, mediaType, dataUrl, size })),
      history: history.slice(-10).map(({ role, text, changes }) => ({ role, text, changes })),
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'AI 设计生成失败');
  if (!data?.project) throw new Error('AI 返回缺少项目描述文件');
  const err = importProjectText(store, JSON.stringify(data.project));
  if (err) throw new Error(`AI 返回的描述文件无效：${err}`);
  return { project: data.project, summary: data.summary || '已生成新方案', changes: data.changes || [], model: data.model };
}

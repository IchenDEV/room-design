import type { RenderQuality } from './types';

export const RENDER_QUALITY_DEFAULT: RenderQuality = 'balanced';
export const RENDER_QUALITIES = ['speed', 'balanced', 'high', 'ultra'] as const;

export const normalizeRenderQuality = (value: unknown): RenderQuality =>
  (RENDER_QUALITIES as readonly unknown[]).includes(value)
    ? value as RenderQuality
    : RENDER_QUALITY_DEFAULT;

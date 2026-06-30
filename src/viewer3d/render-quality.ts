import * as THREE from 'three';
import { normalizeRenderQuality } from '../core/renderQuality';
import type { RenderQuality } from '../core/types';

interface QualityProfile {
  idle: number; mobileIdle: number; motion: number; mobileMotion: number;
  shadowSize: number; shadowType: THREE.ShadowMapType; exposure: number;
  environment: number; hemi: number; shadowRadius: number; antialias: boolean;
}

const PROFILES: Record<RenderQuality, QualityProfile> = {
  speed: {
    idle: 0.95, mobileIdle: 0.8, motion: 0.75, mobileMotion: 0.7,
    shadowSize: 512, shadowType: THREE.PCFShadowMap, exposure: 0.96,
    environment: 0.42, hemi: 0.8, shadowRadius: 0.7, antialias: false,
  },
  balanced: {
    idle: 1.35, mobileIdle: 1, motion: 1, mobileMotion: 0.9,
    shadowSize: 1024, shadowType: THREE.PCFShadowMap, exposure: 1,
    environment: 0.5, hemi: 0.75, shadowRadius: 1, antialias: true,
  },
  high: {
    idle: 1.75, mobileIdle: 1.2, motion: 1.15, mobileMotion: 1,
    shadowSize: 1536, shadowType: THREE.PCFSoftShadowMap, exposure: 1.05,
    environment: 0.62, hemi: 0.68, shadowRadius: 2,
    antialias: true,
  },
  ultra: {
    idle: 2.25, mobileIdle: 1.35, motion: 1.25, mobileMotion: 1.05,
    shadowSize: 2048, shadowType: THREE.VSMShadowMap, exposure: 1.12,
    environment: 0.78, hemi: 0.55, shadowRadius: 4,
    antialias: true,
  },
};

const dpr = () => Math.max(0.75, window.devicePixelRatio || 1);

const isMobileCanvas = (canvas: HTMLCanvasElement) => {
  const host = canvas.parentElement ?? canvas;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || (host.clientWidth || window.innerWidth) < 760;
};

export const renderQualityProfile = (quality: unknown): QualityProfile =>
  PROFILES[normalizeRenderQuality(quality)];

export const rendererAntialias = (quality?: RenderQuality) =>
  renderQualityProfile(quality).antialias && dpr() <= 1.5;

export function syncPixelRatio(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  activeMotion = false,
  quality?: RenderQuality,
): boolean {
  const mobile = isMobileCanvas(canvas);
  const q = renderQualityProfile(quality);
  const cap = activeMotion ? (mobile ? q.mobileMotion : q.motion) : (mobile ? q.mobileIdle : q.idle);
  const next = Math.min(dpr(), cap);
  if (Math.abs(renderer.getPixelRatio() - next) < 0.01) return false;
  renderer.setPixelRatio(next);
  return true;
}

import * as THREE from 'three';

const dpr = () => Math.max(0.75, window.devicePixelRatio || 1);

const isMobileCanvas = (canvas: HTMLCanvasElement) => {
  const host = canvas.parentElement ?? canvas;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || (host.clientWidth || window.innerWidth) < 760;
};

export const rendererAntialias = () => dpr() <= 1.25;

export function syncPixelRatio(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  activeMotion = false,
): boolean {
  const mobile = isMobileCanvas(canvas);
  const cap = activeMotion ? (mobile ? 0.9 : 1) : (mobile ? 1 : 1.35);
  const next = Math.min(dpr(), cap);
  if (Math.abs(renderer.getPixelRatio() - next) < 0.01) return false;
  renderer.setPixelRatio(next);
  return true;
}

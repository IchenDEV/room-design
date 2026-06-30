import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { layoutSun } from './scene-env';
import { renderQualityProfile } from './render-quality';

export interface RenderSettingsState { renderSig: string; cameraSig: string }

const num = (v: number | undefined, fallback: number) => Number.isFinite(v) ? v as number : fallback;

export function applyRenderSettings(v: Viewer3D, state: RenderSettingsState): boolean {
  const s = v.store.project.settings;
  const ray = !!s.rayTracing;
  const q = renderQualityProfile(s.renderQuality);
  const renderSig = JSON.stringify([ray, s.renderQuality, s.sunIntensity, s.sunAzimuth, s.sunElevation]);
  let changed = false;
  if (renderSig !== state.renderSig) {
    const size = ray ? Math.max(q.shadowSize, 2048) : q.shadowSize;
    const type = ray ? THREE.VSMShadowMap : q.shadowType;
    const shadowChanged = v.renderer.shadowMap.type !== type || v.sun.shadow.mapSize.x !== size;
    v.renderer.shadowMap.type = type;
    v.renderer.toneMappingExposure = ray ? Math.max(q.exposure, 1.12) : q.exposure;
    v.scene.environmentIntensity = ray ? Math.max(q.environment, 0.78) : q.environment;
    v.hemi.intensity = ray ? Math.min(q.hemi, 0.55) : q.hemi;
    v.sun.shadow.radius = ray ? Math.max(q.shadowRadius, 4) : q.shadowRadius;
    if (shadowChanged) {
      v.sun.shadow.mapSize.set(size, size);
      v.sun.shadow.map?.dispose();
      v.sun.shadow.map = null;
    }
    layoutSun(v.sun, v.bounds().center, v.bounds().radius, {
      intensity: num(s.sunIntensity, ray ? 2.7 : 2.2),
      azimuth: s.sunAzimuth,
      elevation: s.sunElevation,
    });
    state.renderSig = renderSig;
    changed = true;
  }
  const cameraSig = JSON.stringify([s.cameraX, s.cameraY, s.cameraZ]);
  const customCamera = [s.cameraX, s.cameraY, s.cameraZ].some((x) => Number.isFinite(x));
  if (customCamera && cameraSig !== state.cameraSig) {
    v.camera.position.set(
      num(s.cameraX, v.camera.position.x),
      num(s.cameraY, v.camera.position.y),
      num(s.cameraZ, v.camera.position.z),
    );
    v.controls.update();
    state.cameraSig = cameraSig;
    changed = true;
  }
  return changed;
}

import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { layoutSun } from './scene-env';

export interface RenderSettingsState { renderSig: string; cameraSig: string }

const num = (v: number | undefined, fallback: number) => Number.isFinite(v) ? v as number : fallback;

export function applyRenderSettings(v: Viewer3D, state: RenderSettingsState): boolean {
  const s = v.store.project.settings;
  const ray = !!s.rayTracing;
  const renderSig = JSON.stringify([ray, s.sunIntensity, s.sunAzimuth, s.sunElevation]);
  let changed = false;
  if (renderSig !== state.renderSig) {
    const size = ray ? 2048 : 1024;
    v.renderer.shadowMap.type = ray ? THREE.VSMShadowMap : THREE.PCFShadowMap;
    v.renderer.toneMappingExposure = ray ? 1.12 : 1.0;
    v.scene.environmentIntensity = ray ? 0.78 : 0.5;
    v.hemi.intensity = ray ? 0.55 : 0.75;
    v.sun.shadow.radius = ray ? 4 : 1;
    if (v.sun.shadow.mapSize.x !== size) {
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

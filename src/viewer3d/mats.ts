import * as THREE from 'three';
import type { WallTexture } from '../core/types';
import { floorTexture, wallTexture } from './textures';

const wallCache = new Map<string, THREE.MeshStandardMaterial>();
const floorCache = new Map<string, THREE.MeshStandardMaterial>();
const ceilingCache = new Map<string, THREE.MeshStandardMaterial>();

const shared = <T extends THREE.Material>(m: T): T => {
  m.userData.shared = true;
  return m;
};

export const isSharedMaterial = (m: THREE.Material): boolean => m.userData.shared === true;

export function wallMat(color: string, texture: WallTexture = 'paint'): THREE.MeshStandardMaterial {
  const key = `${color}:${texture}`;
  let m = wallCache.get(key);
  if (!m) {
    const map = texture === 'paint' ? null : wallTexture(texture, color);
    m = shared(new THREE.MeshStandardMaterial({
      color: map ? '#ffffff' : color,
      map,
      roughness: texture === 'concrete' || texture === 'plaster'
        ? 0.96
        : texture === 'wallpaper' ? 0.9 : 0.88,
      metalness: 0,
    }));
    wallCache.set(key, m);
  }
  return m;
}

export function floorMat(floorId: string): THREE.MeshStandardMaterial {
  let m = floorCache.get(floorId);
  if (!m) {
    m = shared(new THREE.MeshStandardMaterial({ map: floorTexture(floorId), roughness: 0.85, metalness: 0 }));
    floorCache.set(floorId, m);
  }
  return m;
}

export function ceilingMat(color = '#f2f0ea'): THREE.MeshStandardMaterial {
  let m = ceilingCache.get(color);
  if (!m) {
    m = shared(new THREE.MeshStandardMaterial({
      color, roughness: 0.95, metalness: 0, side: THREE.DoubleSide,
    }));
    ceilingCache.set(color, m);
  }
  return m;
}

/** 玻璃：墙体/门窗共用 */
export const glassMat = shared(new THREE.MeshPhysicalMaterial({
  color: 0xbfdcec, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.22,
  transmission: 0, side: THREE.DoubleSide, depthWrite: false,
}));

export const frameMat = shared(new THREE.MeshStandardMaterial({ color: 0x8e959c, roughness: 0.4, metalness: 0.65 }));
export const darkFrameMat = shared(new THREE.MeshStandardMaterial({ color: 0x3c4248, roughness: 0.45, metalness: 0.55 }));
export const woodDoorMat = shared(new THREE.MeshStandardMaterial({ color: 0x9a7148, roughness: 0.7, metalness: 0.05 }));
export const handleMat = shared(new THREE.MeshStandardMaterial({ color: 0xc8c2b6, roughness: 0.3, metalness: 0.85 }));
export const ceilMat = ceilingMat();
export const ceilingLightMat = shared(new THREE.MeshStandardMaterial({
  color: 0xffd89a, emissive: 0xffa53a, emissiveIntensity: 1.3, roughness: 0.5,
}));
export const groundMat = shared(new THREE.MeshStandardMaterial({ color: 0x9aa58f, roughness: 1 }));

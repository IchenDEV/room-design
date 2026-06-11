import * as THREE from 'three';

const wallCache = new Map<string, THREE.MeshStandardMaterial>();

export function wallMat(color: string): THREE.MeshStandardMaterial {
  let m = wallCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });
    wallCache.set(color, m);
  }
  return m;
}

/** 玻璃：墙体/门窗共用 */
export const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xbfdcec, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.22,
  transmission: 0, side: THREE.DoubleSide, depthWrite: false,
});

export const frameMat = new THREE.MeshStandardMaterial({ color: 0x8e959c, roughness: 0.4, metalness: 0.65 });
export const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x3c4248, roughness: 0.45, metalness: 0.55 });
export const woodDoorMat = new THREE.MeshStandardMaterial({ color: 0x9a7148, roughness: 0.7, metalness: 0.05 });
export const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8c2b6, roughness: 0.3, metalness: 0.85 });
export const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.95, side: THREE.DoubleSide });
export const groundMat = new THREE.MeshStandardMaterial({ color: 0x9aa58f, roughness: 1 });

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { skyTexture } from './textures';
import { groundMat } from './mats';

export interface SceneKit {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  sun: THREE.DirectionalLight;
}

export function initScene(canvas: HTMLCanvasElement): SceneKit {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xdfe8ef, 4500, 12000);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(52, 1, 5, 30000);
  camera.position.set(700, 760, 760);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 80;
  controls.maxDistance = 6000;

  const hemi = new THREE.HemisphereLight(0xdfeaf5, 0xb3a88f, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 2;
  scene.add(sun);
  scene.add(sun.target);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(9000, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  ground.receiveShadow = true;
  scene.add(ground);

  return { renderer, scene, camera, controls, sun };
}

/** 根据场景包围盒布置太阳与阴影相机 */
export function layoutSun(sun: THREE.DirectionalLight, center: THREE.Vector3, radius: number) {
  sun.position.set(center.x + radius * 0.9, radius * 1.5, center.z + radius * 0.7);
  sun.target.position.copy(center);
  const c = sun.shadow.camera;
  c.left = -radius * 1.5; c.right = radius * 1.5;
  c.top = radius * 1.5; c.bottom = -radius * 1.5;
  c.near = 10; c.far = radius * 5;
  c.updateProjectionMatrix();
}

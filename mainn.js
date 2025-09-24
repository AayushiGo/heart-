import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

console.clear();

// Scene / Camera / Renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 2, 6);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Shader uniforms
let uniforms = {
  time: { value: 0 },
  totalLength: { value: 10 },
  pipeFittingAt: { value: 0 },
  pipeFittingWidth: { value: 1 },
  pipeFittingColor: { value: new THREE.Color(0x0000ff) } // yellow highlight
};

// Custom ShaderMaterial (Heart + pipe fitting animation)
let heartMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  side: THREE.DoubleSide,
  defines: { USE_UV: "" },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.2);
    }
  `,
  fragmentShader: `
    #define S(a, b, c) smoothstep(a, b, c)
    varying vec2 vUv;
    uniform float time;
    uniform float totalLength;
    uniform float pipeFittingAt;
    uniform float pipeFittingWidth;
    uniform vec3 pipeFittingColor;

    float heartShape(vec2 p) {
      p = p * 2.0 - 1.0; // center at (0,0)
      float x = p.x;
      float y = p.y;
      return pow(x*x + y*y - 1.0, 3.0) - x*x*y*y*y;
    }

    void main() {
      // Base heart color
      float h = heartShape(vUv * 1.5);
      vec3 baseColor = mix(vec3(1.0, 0.0, 0.2), vec3(0.1), step(0.0, h));

      // Animate pipeFittingAt
      float movingAt = mod(pipeFittingAt + time * 2.2, totalLength);
      float normAt = movingAt / totalLength;
      float normWidth = pipeFittingWidth / totalLength;
      float hWidth = normWidth * 0.5;
      float fw = fwidth(vUv.x);
      float f = S(hWidth + fw, hWidth, abs(vUv.x - normAt));

      // Blend highlight
      vec3 finalColor = mix(baseColor, pipeFittingColor, f);

      gl_FragColor = vec4(finalColor, 1.2);
    }
  `
});

// Load GLTF and apply heart shader
const loader = new GLTFLoader();
loader.load("heart.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = heartMaterial;
    }
  });
  scene.add(gltf.scene);
  gltf.scene.position.y -= 3
});

// Animate
let clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  uniforms.time.value = clock.getElapsedTime(); // update time
  controls.update();
  renderer.render(scene, camera);
});

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Postprocessing imports
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// Scene / Camera / Renderer
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x011111); // black background

let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 2, 8);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
let keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 8, 10);
scene.add(keyLight);

let fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-6, 4, -4);
scene.add(fillLight);

let rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
rimLight.position.set(0, 10, -10);
scene.add(rimLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.2));

/* ------------------ HEART SHADER ------------------ */
let uniforms = {
  time: { value: 0 },
  baseColor: { value: new THREE.Color(0x000000) }, // black base
  lightPos: { value: new THREE.Vector3(5, 10, 7) },
  cameraPos: { value: new THREE.Vector3() },

  
  totalLength: { value: 1.0 },
  pipeFittingAt: { value: 0.0 },
  pipeFittingWidth: { value: 0.25 },
  pipeFittingColor: { value: new THREE.Color(0x5cc9FF) } // BLUE glow
};

let heartMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  side: THREE.DoubleSide,
  defines: { USE_UV: "" },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define S(a, b, c) smoothstep(a, b, c)

    uniform vec3 lightPos;
    uniform vec3 cameraPos;
    uniform vec3 baseColor;

    uniform float totalLength;
    uniform float pipeFittingAt;
    uniform float pipeFittingWidth;
    uniform vec3 pipeFittingColor;
    uniform float time;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // phong lighting
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(lightPos - vPosition);
      vec3 viewDir = normalize(cameraPos - vPosition);

      float diff = max(dot(normal, lightDir), 0.0);
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);

      vec3 color = baseColor * diff + vec3(1.0) * spec * 0.6;

      // moving highlight band (horizontal)
      float normAt = pipeFittingAt / totalLength;
      float normWidth = pipeFittingWidth / totalLength;
      float hWidth = normWidth * 0.5;
      float fw = fwidth(vUv.x);

      float band = S(hWidth + fw, hWidth, abs(vUv.x - normAt));

      // pulsating glow
      float pulse = 0.6 + 0.4 ;

      // glowing additive BLUE
      vec3 glow = pipeFittingColor * band * (2.5 * pulse);

      // add glow on top
      color += glow;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

// Load GLTF Heart
const loader = new GLTFLoader();
loader.load("heart.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = heartMaterial;
    }
  });
  gltf.scene.position.y = -3;
  scene.add(gltf.scene);
});

/* ------------------ POSTPROCESSING: BLOOM ------------------ */
let composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

let bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.5, // strength
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);

/* ------------------ ANIMATE ------------------ */
let clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  let t = clock.getElapsedTime();

  uniforms.time.value = t;
  uniforms.cameraPos.value.copy(camera.position);

  // animate highlight band moving
  uniforms.pipeFittingAt.value = (t * 0.2) % 1.0;

  controls.update();
  composer.render(); // render with bloom
}); 
import * as THREE from "three";
import "./style.css";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { PMREMGenerator } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// scene
const scene = new THREE.Scene();
const DirectionalLight1 = new THREE.DirectionalLight("blue", 5);
scene.add(DirectionalLight1);

DirectionalLight1.position.y = -2;
DirectionalLight1.position.z = 1;

const DirectionalLight2 = new THREE.DirectionalLight("lightblue", 5);
scene.add(DirectionalLight2);



//

// camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 20;

// renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// PMREM Generator
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// // Load HDR Environment Map
// const rgbeLoader = new RGBELoader();
// rgbeLoader.load(
//   "public/pond_bridge_night_1k.hdr",
//   (texture) => {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//     const envMap = pmremGenerator.fromEquirectangular(texture).texture;
//     scene.environment = envMap;
//     scene.background = envMap;
//     texture.dispose();
//     pmremGenerator.dispose();
//   },
//   undefined,
//   (error) => {
//     console.error("An error happened while loading the HDR texture:", error);
//   }
// );

// gltf loader
const loader = new GLTFLoader();
loader.load(
  "/heart.glb",
  (gltf) => {
    console.log("GLTF Loaded:", gltf); // 👀 check what’s inside
    const model = gltf.scene;
    if (!model) {
      console.error("No scene found in GLTF!");
      return;
    }
    model.traverse((child) => {
      if (child.isMesh) {
        console.log("Material:", child.material);
      }
    });
    scene.add(model);
    model.position.y = -2;
  },
  undefined,
  (error) => {
    console.error("An error happened while loading the model:", error);
  }
);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;



// render loop
function animate() {
  window.requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

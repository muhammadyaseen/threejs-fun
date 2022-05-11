import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/FBXLoader.js';
//import * as Draughts from './draughts.js'

var scene, camera, renderer, cube, controls, draughts, board;
 
const darkPiece = new THREE.MeshStandardMaterial( { color: 0x222222 } );
const lightPiece = new THREE.MeshStandardMaterial( { color: 0xDDDDDD });

const _VS = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const _FS = `
    void main() {
        gl_FragColor = vec4(0.0, 0.3, 0.3, 0.1);
    }
`;

function init() {


draughts = new Draughts();
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

  const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  dirLight.position.set(20, 100, 10);
  dirLight.target.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.001;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 500.0;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500.0;
  dirLight.shadow.camera.left = 100;
  dirLight.shadow.camera.right = -100;
  dirLight.shadow.camera.top = 100;
  dirLight.shadow.camera.bottom = -100;
  scene.add(dirLight);
  
  const ambLight = new THREE.AmbientLight(0xFFFFFF);
  scene.add(ambLight); 
 
  const square = new THREE.BoxGeometry(1, 0.1, 1);
  //const lightsquare = new THREE.MeshBasicMaterial( { color: 0xE0C4A8 } );
  const glowingSquare = new THREE.ShaderMaterial({ 
      uniforms: {},
      vertexShader: _VS,
      fragmentShader: _FS
  });
  const darksquare = new THREE.MeshBasicMaterial( { color: 0x6A4236});
  board = new THREE.Group();
 
  const light = new THREE.PointLight( 0xffffff, 2, 200 );
  light.position.set(5, 10, 5);
  scene.add(light);
 
  let cubeNumber = 1;
  // create the checker board
  for (let x = 0; x < 10; x++) {
    for (let z = 0; z < 10; z++) {
      let cube;
      if (z % 2 == 0) {
        cube = new THREE.Mesh(square, x % 2 == 0 ? glowingSquare : glowingSquare);
        if (x % 2 != 0) {
          cube.userData.cubeNumber = cubeNumber;
          cubeNumber++;
        }
      }
      else {
        cube = new THREE.Mesh(square, x % 2 == 0 ? glowingSquare : glowingSquare);
        if (x % 2 == 0) {
          cube.userData.cubeNumber = cubeNumber;
          cubeNumber++;
        }
      }
      cube.position.set(x, 0, z);
      board.add(cube);
    }
  }
  scene.add(board);
 
  const fbxLoader = new FBXLoader()
  fbxLoader.load(
      './aj.fbx',
      (object) => {
          console.log(object.scale);
          scene.add(object);
      },
      (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      (error) => {
          console.log(error)
      }
  )


  const loader = new GLTFLoader();
  loader.load( './checkers.glb', function ( gltf ) {
    console.log(gltf)
    const checkerMesh = gltf.scene.children.find((child) => child.name === "Cylinder");
    checkerMesh.scale.set(checkerMesh.scale.x * 0.4, checkerMesh.scale.y * 0.4, checkerMesh.scale.z * 0.4);
    checkerMesh.geometry.computeBoundingBox();
    console.log(checkerMesh.geometry.boundingBox);
    checkerMesh.position.y += checkerMesh.scale.y + 0.05;
    addCheckers(checkerMesh);
  }, undefined, function ( error ) {
 
    console.error( error );
 
  } );
 
  // set up camera
  camera.position.y = 8;
  camera.position.set(4.5, 5, 4.5);
  camera.lookAt(5, 0, 5);
  
  // set up orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(4.5, 0, 4.5);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2;
  controls.enableDamping = true;
 
  window.requestAnimationFrame(animate);
}
 
function animate() {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}
 
function positionForSquare(square) {
  const found = board.children.find((child) => child.userData.cubeNumber == square);
  if (found)
    return found.position;
  return null;
}
 
function addCheckers(checkerMesh) {
  console.log(draughts.fen());
 
  for (let i = 1; i < 51; i++) {
    let pieceOn = draughts.get(i);
 
    const squarePosition = positionForSquare(i);
 
    if (pieceOn === 'b') {
      const piece = checkerMesh.clone(true);
      piece.material = darkPiece;
      piece.userData.color = 'b';
      piece.userData.currentSquare = i;
      piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
      scene.add(piece);
    } else if (pieceOn === 'w') {
      const piece = checkerMesh.clone(true);
      piece.material = lightPiece;
      piece.userData.color = 'w';
      piece.userData.currentSquare = i;
      piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
      scene.add(piece);
    }
  }
}
 
function onWindowResize() {
 
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
 
 
window.addEventListener('resize', onWindowResize);
window.onload = init;
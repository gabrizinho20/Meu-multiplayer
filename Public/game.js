import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

const socket = io();

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Câmera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Chão
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Jogador (cubo)
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.y = 1;
scene.add(player);

// Controles de câmera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Movimento toque (celular)
window.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth) * 20 - 10;
    const z = (touch.clientY / window.innerHeight) * 20 - 10;

    player.position.x = x;
    player.position.z = z;

    socket.emit("move", { x, y: z });
});

// Multiplayer receber outros players
const otherPlayers = {};

socket.on("currentPlayers", (players) => {
    for (let id in players) {
        if (id !== socket.id) {
            addOtherPlayer(id, players[id]);
        }
    }
});

socket.on("newPlayer", (data) => addOtherPlayer(data.id, data));
socket.on("playerMoved", (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].position.x = data.x;
        otherPlayers[data.id].position.z = data.y;
    }
});
socket.on("playerDisconnected", (id) => {
    scene.remove(otherPlayers[id]);
    delete otherPlayers[id];
});

function addOtherPlayer(id, data) {
    const geo = new THREE.BoxGeometry(1, 2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.x, 1, data.y);
    scene.add(mesh);
    otherPlayers[id] = mesh;
}

// Loop do jogo
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    camera.lookAt(player.position);
    renderer.render(scene, camera);
}
animate();

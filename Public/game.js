const socket = io();

// ===== CENA =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ===== LUZ =====
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

// ===== CHÃO =====
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshLambertMaterial({ color: 0x228822 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ===== PLAYER =====
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshLambertMaterial({ color: 0x00aaff })
);
player.position.y = 1;
scene.add(player);

let velocityY = 0;
let canJump = true;

// ===== HUD =====
let hp = 100;
let kills = 0;
const hpUI = document.getElementById("hp");
const killsUI = document.getElementById("kills");

// ===== TIRO =====
function shoot() {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );

  bullet.position.copy(player.position);
  scene.add(bullet);

  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);

  const interval = setInterval(() => {
    bullet.position.add(dir.clone().multiplyScalar(1));

    enemies.forEach((enemy, i) => {
      if (bullet.position.distanceTo(enemy.position) < 1) {
        scene.remove(enemy);
        enemies.splice(i,1);
        scene.remove(bullet);
        clearInterval(interval);
        kills++;
        killsUI.textContent = kills;
      }
    });

    if (bullet.position.length() > 300) {
      scene.remove(bullet);
      clearInterval(interval);
    }
  }, 16);
}

// ===== CONSTRUIR =====
function buildWall() {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(3,3,1),
    new THREE.MeshLambertMaterial({ color: 0x888888 })
  );

  wall.position.copy(player.position);
  wall.position.z -= 5;
  wall.position.y = 1.5;
  scene.add(wall);
}

// ===== INIMIGOS =====
const enemies = [];

function spawnEnemy() {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshLambertMaterial({ color: 0xff0000 })
  );

  enemy.position.set(
    (Math.random()-0.5)*50,
    1,
    -50 - Math.random()*50
  );

  scene.add(enemy);
  enemies.push(enemy);
}

setInterval(spawnEnemy, 3000);

// ===== CONTROLES MOBILE =====
document.getElementById("shootBtn").onclick = shoot;
document.getElementById("buildBtn").onclick = buildWall;
document.getElementById("jumpBtn").onclick = () => {
  if (canJump) {
    velocityY = 0.2;
    canJump = false;
  }
};

// ===== GRAVIDADE + LOOP =====
function animate() {
  requestAnimationFrame(animate);

  velocityY -= 0.01;
  player.position.y += velocityY;

  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    canJump = true;
  }

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 5;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

// ===== RESPONSIVO =====
addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x87ceeb);

// LUZ
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));

// CHÃO
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshLambertMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// PLAYER
let player = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshLambertMaterial({ color: 0x0000ff })
);
player.position.y = 1;
scene.add(player);

camera.position.set(0,5,8);

// VIDA
let hp = 100;
const hpUI = document.getElementById("hp");

// MOVIMENTO
let speed = 0.15;
let velocityY = 0;
let gravity = -0.01;
let onGround = true;
let keys = {};

// BOTÕES MOBILE
function hold(btn, key){
  document.getElementById(btn).ontouchstart = () => keys[key] = true;
  document.getElementById(btn).ontouchend = () => keys[key] = false;
}
hold("up","w");
hold("down","s");
hold("left","a");
hold("right","d");

document.getElementById("jump").ontouchstart = () => {
  if(onGround){ velocityY = 0.22; onGround=false; }
};

// TIROS
let bullets = [];
document.getElementById("shoot").ontouchstart = () => {
  let bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({color:0xffff00})
  );
  bullet.position.copy(player.position);
  scene.add(bullet);
  bullet.userData.vel = new THREE.Vector3(0,0,-0.6);
  bullets.push(bullet);
};

// INIMIGOS
let enemies = [];
function spawnEnemy(){
  let enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshLambertMaterial({ color:0xff0000 })
  );
  enemy.position.set((Math.random()-0.5)*40,1,-30-Math.random()*40);
  scene.add(enemy);
  enemies.push(enemy);
}
setInterval(spawnEnemy, 3000);

// LOOP
function animate(){
  requestAnimationFrame(animate);

  // Movimento player
  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  velocityY += gravity;
  player.position.y += velocityY;
  if(player.position.y <= 1){
    player.position.y = 1;
    velocityY = 0;
    onGround = true;
  }

  // Tiros andando
  bullets.forEach((b,bi)=>{
    b.position.add(b.userData.vel);

    enemies.forEach((e,ei)=>{
      if(b.position.distanceTo(e.position) < 1){
        scene.remove(e);
        scene.remove(b);
        enemies.splice(ei,1);
        bullets.splice(bi,1);
      }
    });
  });

  // Inimigos perseguindo
  enemies.forEach(enemy=>{
    let dir = player.position.clone().sub(enemy.position).normalize();
    enemy.position.add(dir.multiplyScalar(0.03));

    // Dano no player
    if(enemy.position.distanceTo(player.position) < 1.5){
      hp -= 0.1;
      hpUI.textContent = Math.floor(hp);
    }
  });

  // MORTE
  if(hp <= 0){
    alert("VOCÊ MORREU!");
    location.reload();
  }

  // Câmera
  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 8;
  camera.lookAt(player.position);

  renderer.render(scene,camera);
}
animate();

onresize = () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};

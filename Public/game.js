// CENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// CAMERA
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,5,10);

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// LUZ
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

// CHÃO
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshLambertMaterial({ color:0x228B22 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// PLAYER
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshLambertMaterial({ color:0x0066ff })
);
player.position.y = 1;
scene.add(player);

// INIMIGOS
const enemies = [];
for(let i=0;i<5;i++){
  const e = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshLambertMaterial({ color:0xff0000 })
  );
  e.position.set(Math.random()*50-25,1,Math.random()*-50);
  scene.add(e);
  enemies.push(e);
}

// TIROS
const bullets = [];
let kills = 0;

// CONTROLES MOBILE
const move = { up:false, down:false, left:false, right:false };

function bindBtn(id, key){
  const btn = document.getElementById(id);
  btn.ontouchstart = () => move[key] = true;
  btn.ontouchend = () => move[key] = false;
}

bindBtn("up","up");
bindBtn("down","down");
bindBtn("left","left");
bindBtn("right","right");

// PULO
let velocityY = 0;
document.getElementById("jump").ontouchstart = () => {
  if(player.position.y <= 1.01) velocityY = 0.25;
};

// TIRO
document.getElementById("shoot").ontouchstart = () => {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color:0xffff00 })
  );
  bullet.position.copy(player.position);
  scene.add(bullet);
  bullets.push(bullet);
};

// CONSTRUÇÃO
document.getElementById("build").ontouchstart = () => {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(2,2,0.5),
    new THREE.MeshLambertMaterial({ color:0x8B4513 })
  );
  wall.position.set(player.position.x,1,player.position.z-3);
  scene.add(wall);
};

// LOOP
function animate(){
  requestAnimationFrame(animate);

  const speed = 0.15;
  if(move.up) player.position.z -= speed;
  if(move.down) player.position.z += speed;
  if(move.left) player.position.x -= speed;
  if(move.right) player.position.x += speed;

  velocityY -= 0.01;
  player.position.y += velocityY;
  if(player.position.y < 1){
    player.position.y = 1;
    velocityY = 0;
  }

  bullets.forEach((b,bi)=>{
    b.position.z -= 0.5;

    enemies.forEach((e,ei)=>{
      if(b.position.distanceTo(e.position) < 1){
        scene.remove(e);
        scene.remove(b);
        enemies.splice(ei,1);
        bullets.splice(bi,1);
        kills++;
        document.getElementById("kills").innerText = kills;
      }
    });
  });

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 8;
  camera.lookAt(player.position);

  renderer.render(scene,camera);
}

animate();

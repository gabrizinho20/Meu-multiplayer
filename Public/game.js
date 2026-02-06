// --------------------
// SETUP THREE
// --------------------
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,5,10);
camera.lookAt(0,0,0);
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

let hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemiLight);
let dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(10,20,10); scene.add(dirLight);

// --------------------
// CHÃO
// --------------------
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshLambertMaterial({color:0x228B22})
);
ground.rotation.x = -Math.PI/2; scene.add(ground);

// --------------------
// ÁRVORES
// --------------------
let trees = [];
function spawnTree(x,z){
  let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,3), new THREE.MeshLambertMaterial({color:0x8B4513}));
  trunk.position.set(x,1.5,z);
  let leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5,3,8), new THREE.MeshLambertMaterial({color:0x00aa00}));
  leaves.position.set(x,4.5,z);
  scene.add(trunk); scene.add(leaves); trees.push(trunk,leaves);
}
for(let i=0;i<50;i++){spawnTree((Math.random()-0.5)*200,(Math.random()-0.5)*200);}

// --------------------
// PLAYER
// --------------------
let player = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshLambertMaterial({color:0x0000ff}));
player.position.y = 1; scene.add(player);

// --------------------
// HUD + MINI MAP
// --------------------
let hp=100, kills=0;
const hpUI = document.getElementById("hp");
const killsUI = document.getElementById("kills");
const miniMap = document.getElementById("miniMap");
let miniCtx = miniMap.getContext("2d");

// --------------------
// ANALÓGICOS
// --------------------
let moveX=0, moveZ=0, lookX=0, lookY=0;
let speed=0.15, velocityY=0, gravity=-0.01;

// Esquerdo
const joystick=document.getElementById("joystick");
const stick=document.getElementById("stick");
let touchIdLeft=null,startXLeft,startYLeft;
joystick.addEventListener("touchstart",e=>{e.preventDefault(); const t=e.changedTouches[0]; touchIdLeft=t.identifier; startXLeft=t.clientX; startYLeft=t.clientY;});
joystick.addEventListener("touchmove",e=>{for(const t of e.changedTouches){if(t.identifier!==touchIdLeft) continue; let dx=t.clientX-startXLeft,dy=t.clientY-startYLeft;let max=50;if(Math.hypot(dx,dy)>max){let angle=Math.atan2(dy,dx);dx=Math.cos(angle)*max;dy=Math.sin(angle)*max;} stick.style.transform=`translate(${dx}px,${dy}px)`; moveX=dx/50; moveZ=dy/50;}});
joystick.addEventListener("touchend",e=>{for(const t of e.changedTouches){if(t.identifier!==touchIdLeft) continue; touchIdLeft=null; moveX=0; moveZ=0; stick.style.transform="translate(0px,0px)";}});

// Direito
let lookJoystick=document.createElement("div"); lookJoystick.id="lookJoystick";
lookJoystick.style.position="fixed"; lookJoystick.style.right="20px"; lookJoystick.style.bottom="200px";
lookJoystick.style.width="150px"; lookJoystick.style.height="150px"; lookJoystick.style.borderRadius="50%";
lookJoystick.style.background="rgba(255,255,255,0.2)"; lookJoystick.style.touchAction="none";
let lookStick=document.createElement("div"); lookStick.style.position="absolute"; lookStick.style.left="50%"; lookStick.style.top="50%";
lookStick.style.width="60px"; lookStick.style.height="60px"; lookStick.style.margin="-30px 0 0 -30px"; lookStick.style.borderRadius="50%";
lookStick.style.background="rgba(255,255,255,0.5)"; lookJoystick.appendChild(lookStick);
document.body.appendChild(lookJoystick);
let touchIdRight=null,startXRight,startYRight;
lookJoystick.addEventListener("touchstart",e=>{e.preventDefault(); const t=e.changedTouches[0]; touchIdRight=t.identifier; startXRight=t.clientX; startYRight=t.clientY;});
lookJoystick.addEventListener("touchmove",e=>{for(const t of e.changedTouches){if(t.identifier!==touchIdRight) continue; let dx=t.clientX-startXRight,dy=t.clientY-startYRight;let max=50;if(Math.hypot(dx,dy)>max){let angle=Math.atan2(dy,dx);dx=Math.cos(angle)*max;dy=Math.sin(angle)*max;} lookStick.style.transform=`translate(${dx}px,${dy}px)`; lookX=dx/50; lookY=dy/50;}});
lookJoystick.addEventListener("touchend",e=>{for(const t of e.changedTouches){if(t.identifier!==touchIdRight) continue; touchIdRight=null; lookX=0; lookY=0; lookStick.style.transform="translate(0px,0px)";}});

// --------------------
// ARMAS + LOOT
// --------------------
let weapons=[{name:"Pistola",damage:10,speed:0.6,color:0xffff00},{name:"Rifle",damage:20,speed:1.0,color:0xffaa00},{name:"Sniper",damage:50,speed:1.5,color:0xff0000}];
for(let i=0;i<20;i++){weapons.push({name:"Weapon"+(i+1),damage:5+Math.floor(Math.random()*50),speed:0.5+Math.random()*2,color:Math.random()*0xffffff});}
let currentWeapon=0, bullets=[];

document.getElementById("shoot").ontouchstart=()=>shootWeapon();
document.getElementById("changeWeapon").ontouchstart=()=>{currentWeapon=(currentWeapon+1)%weapons.length;};

function shootWeapon(){
  const w=weapons[currentWeapon];
  let bullet=new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color:w.color}));
  bullet.position.copy(player.position);
  bullet.userData={vel:new THREE.Vector3(lookX*0.6,0,-w.speed), damage:w.damage};
  scene.add(bullet); bullets.push(bullet);
  createExplosionEffect(bullet.position);
  socket.emit("shoot",{pos:bullet.position,vel:bullet.userData.vel,damage:w.damage});
}

// Loot
let lootItems=[];
function spawnLoot(){let w=weapons[Math.floor(Math.random()*weapons.length)]; let loot=new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshLambertMaterial({color:w.color})); loot.position.set((Math.random()-0.5)*50,0.5,(Math.random()-0.5)*50); loot.userData={weapon:w}; scene.add(loot); lootItems.push(loot);}
setInterval(()=>{if(lootItems.length<10) spawnLoot();},5000);
function collectLoot(){lootItems.forEach((l,li)=>{if(player.position.distanceTo(l.position)<1.5){weapons.push(l.userData.weapon); scene.remove(l); lootItems.splice(li,1);}});}

// --------------------
// EXPLOSÕES
// --------------------
function createExplosionEffect(pos){
  let geo=new THREE.SphereGeometry(0.5,8,8);
  let mat=new THREE.MeshBasicMaterial({color:0xffaa00});
  let exp=new THREE.Mesh(geo,mat); exp.position.copy(pos);
  scene.add(exp);
  setTimeout(()=>{scene.remove(exp);},300);
}

// --------------------
// CONSTRUÇÃO + GRANADAS
// --------------------
let builds=[];
document.getElementById("build").ontouchstart=()=>{let wall=new THREE.Mesh(new THREE.BoxGeometry(2,2,0.5), new THREE.MeshLambertMaterial({color:0x888888})); wall.position.set(player.position.x,1,player.position.z-3); scene.add(wall); builds.push(wall); socket.emit("build",{type:"wall",pos:wall.position});};
document.getElementById("ramp").ontouchstart=()=>{let ramp=new THREE.Mesh(new THREE.BoxGeometry(3,0.5,4), new THREE.MeshLambertMaterial({color:0xaaaaaa})); ramp.rotation.x=-Math.PI/6; ramp.position.set(player.position.x,0.5,player.position.z-4); scene.add(ramp); builds.push(ramp); socket.emit("build",{type:"ramp",pos:ramp.position});};
document.getElementById("grenade").ontouchstart=()=>{let grenade=new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color:0x00ff00})); grenade.position.copy(player.position); scene.add(grenade); createExplosionEffect(grenade.position); setTimeout(()=>{Object.values(otherPlayers).forEach(p=>{if(p.mesh.position.distanceTo(grenade.position)<5)p.hp-=50;}); scene.remove(grenade);},1000);};

// --------------------
// MULTIPLAYER
// --------------------
let socket=io(); let otherPlayers={};
socket.on("updatePlayers",data=>{for(const id in data){if(id===socket.id) continue; if(!otherPlayers[id]){let p=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshLambertMaterial({color:0xff00ff})); p.position.copy(data[id]); scene.add(p); otherPlayers[id]={mesh:p,hp:data[id].hp};} else{otherPlayers[id].mesh.position.copy(data[id]); otherPlayers[id].hp=data[id].hp;}}});

// --------------------
// NPCs
// --------------------
let enemies=[]; function spawnEnemy(){let enemy=new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshLambertMaterial({color:0xff0000})); enemy.position.set((Math.random()-0.5)*40,1,-30-Math.random()*40); scene.add(enemy); enemies.push(enemy);} setInterval(spawnEnemy,3000);

// --------------------
// LOOP PRINCIPAL
// --------------------
function checkCollision(player,obj){let px=player.position.x,pz=player.position.z; let sx=1,sz=1; let ox=obj.position.x,oz=obj.position.z; let osx=obj.geometry.parameters.width||2; let osz=obj.geometry.parameters.depth||2; return Math.abs(px-ox)<(sx/2+osx/2)&&Math.abs(pz-oz)<(sz/2+osz/2);}
function animate(){
  requestAnimationFrame(animate);
  // MOVIMENTO
  let nextX=player.position.x+moveX*speed;
  let nextZ=player.position.z+moveZ*speed; let collision=false;
  for(let b of builds){if(checkCollision({position:{x:nextX,z:nextZ}},b)){collision=true; break;}}
  if(!collision){player.position.x=nextX; player.position.z=nextZ;}
  velocityY+=gravity; player.position.y+=velocityY; if(player.position.y<=1)player.position.y=1;
  // RAMPAS
  for(let b of builds){if(b.rotation.x<0){let dx=player.position.x-b.position.x; let dz=player.position.z-b.position.z; if(Math.abs(dx)<1.5&&Math.abs(dz)<2){player.position.y=b.position.y+0.5; velocityY=0;}}}
  // BULLETS
  bullets.forEach((b,bi)=>{b.position.add(b.userData.vel); enemies.forEach((e,ei)=>{if(b.position.distanceTo(e.position)<1){scene.remove(e);scene.remove(b);createExplosionEffect(e.position); enemies.splice(ei,1); bullets.splice(bi,1); kills++; killsUI.innerText=kills;}});});
  collectLoot();
  socket.emit("move",{x:player.position.x,y:player.position.y,z:player.position.z,hp});
  if(hp<=0){alert("VOCÊ MORREU!"); location.reload();}
  camera.position.x=player.position.x+lookX*5; camera.position.z=player.position.z+8+lookY*5; camera.position.y=player.position.y+5; camera.lookAt(player.position);
  // MINI MAP
  miniCtx.clearRect(0,0,150,150); miniCtx.fillStyle="white"; miniCtx.fillRect(75,75,5,5);
  enemies.forEach(e=>{miniCtx.fillStyle="red"; miniCtx.fillRect(75+(e.position.x-player.position.x)/4,75+(e.position.z-player.position.z)/4,3,3);});
  renderer.render(scene,camera);
}
animate();
onresize=()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);};

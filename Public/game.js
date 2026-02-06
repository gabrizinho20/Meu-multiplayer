// -----------------------------------------------------------
// ULTRA GOD MODE - PATINHOS COM IA + INVENTÁRIO + NATUREZA
// -----------------------------------------------------------

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// LUZES
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
let sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 50, 50);
sun.castShadow = true;
scene.add(sun);

// CHÃO
let ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ color: 0x3d8c40 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- SISTEMA DE INVENTÁRIO ---
let inventory = { madeira: 0 };
let hp = 100;
const hpUI = document.getElementById("hp");
let woodUI = document.createElement("div");
woodUI.style = "position:fixed; top:40px; left:10px; color:white; font-size:20px; font-family:sans-serif; text-shadow: 2px 2px #000;";
document.body.appendChild(woodUI);

function updateUI() {
    woodUI.innerText = "🪓 Madeira: " + inventory.madeira;
    if(hpUI) hpUI.innerText = "❤️ HP: " + hp;
}

// --- ENTIDADES (PATINHOS, ÁRVORES, ETC) ---
let ducks = [];
function createDuck(x, z) {
    let duck = new THREE.Group();
    let body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), new THREE.MeshLambertMaterial({ color: 0xffff00 }));
    let head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0xffff00 }));
    let beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), new THREE.MeshLambertMaterial({ color: 0xffa500 }));
    body.position.y = 0.2; head.position.set(0, 0.5, 0.3); beak.position.set(0, 0.5, 0.5);
    duck.add(body, head, beak); duck.position.set(x, 0, z);
    
    // IA do Patinho: velocidade e direção aleatória
    duck.userData = { 
        dir: new THREE.Vector3((Math.random()-0.5), 0, (Math.random()-0.5)).normalize(),
        timer: 0 
    };
    
    scene.add(duck);
    ducks.push(duck);
}

// Gerar Natureza
for(let i=0; i<60; i++) {
    let rx = (Math.random()-0.5)*200; let rz = (Math.random()-0.5)*200;
    if(i < 30) { // Árvores
        let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        let leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), new THREE.MeshLambertMaterial({ color: 0x1b5e20 }));
        trunk.position.set(rx, 1, rz); leaves.position.set(rx, 3, rz);
        scene.add(trunk, leaves);
    }
    if(i < 15) createDuck((Math.random()-0.5)*100, (Math.random()-0.5)*100);
}

// --- LOOT (MADEIRA NO CHÃO) ---
let loots = [];
function spawnWood() {
    let wood = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    wood.rotation.z = Math.PI/2;
    wood.position.set((Math.random()-0.5)*150, 0.1, (Math.random()-0.5)*150);
    scene.add(wood);
    loots.push(wood);
}
setInterval(spawnWood, 4000);

// --- PLAYER E CONSTRUÇÃO ---
let player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshLambertMaterial({ color: 0x1a237e }));
player.position.y = 1; scene.add(player);

let ghost = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 }));
scene.add(ghost);

// BOTÕES
document.getElementById("build").ontouchstart = () => build("wall");
document.getElementById("ramp").ontouchstart = () => build("ramp");

function build(type) {
    if(inventory.madeira >= 10) {
        inventory.madeira -= 10;
        let b = new THREE.Mesh(ghost.geometry.clone(), new THREE.MeshLambertMaterial({ color: 0x757575 }));
        b.position.copy(ghost.position); b.rotation.copy(ghost.rotation);
        scene.add(b); updateUI();
    } else { alert("Falta madeira!"); }
}

// --- LOOP DE ANIMAÇÃO ---
let moveX=0, moveZ=0, lookX=0, lookY=0;
function animate() {
    requestAnimationFrame(animate);
    
    // Movimento Jogador
    player.position.x += moveX * 0.2; player.position.z += moveZ * 0.2;
    ghost.position.set(Math.round(player.position.x/3)*3, 1.25, Math.round((player.position.z-4)/3)*3);

    // IA DOS PATINHOS
    ducks.forEach(duck => {
        let dist = duck.position.distanceTo(player.position);
        
        if(dist < 8) { // FUGIR
            let escapeDir = new THREE.Vector3().subVectors(duck.position, player.position).normalize();
            duck.position.addScaledVector(escapeDir, 0.15); // Velocidade de fuga
            duck.lookAt(duck.position.x + escapeDir.x, 0, duck.position.z + escapeDir.z);
        } else { // ANDAR ALEATÓRIO
            duck.userData.timer++;
            if(duck.userData.timer > 100) {
                duck.userData.dir.set((Math.random()-0.5), 0, (Math.random()-0.5)).normalize();
                duck.userData.timer = 0;
            }
            duck.position.addScaledVector(duck.userData.dir, 0.03);
            duck.lookAt(duck.position.x + duck.userData.dir.x, 0, duck.position.z + duck.userData.dir.z);
        }
    });

    // Coleta de Madeira
    loots.forEach((l, i) => {
        if(player.position.distanceTo(l.position) < 2) {
            scene.remove(l); loots.splice(i, 1);
            inventory.madeira += 5; updateUI();
        }
    });

    // Câmera Suave
    camera.position.lerp(new THREE.Vector3(player.position.x + lookX*7, 7, player.position.z + 12), 0.1);
    camera.lookAt(player.position);
    
    renderer.render(scene, camera);
}
updateUI();
animate();

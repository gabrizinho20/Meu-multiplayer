// -----------------------------------------------------------
// ULTRA GOD MODE - DIA/NOITE, PARTÍCULAS E PLACAR
// -----------------------------------------------------------

let scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ILUMINAÇÃO DINÂMICA (SOL)
let sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 50, 50);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0x404040, 0.5));

// --- CICLO DIA E NOITE ---
let time = 0;
function updateSky() {
    time += 0.002; // Velocidade do tempo
    let sunY = Math.sin(time);
    sun.position.set(Math.cos(time)*50, sunY*50, 20);
    sun.intensity = Math.max(0, sunY + 0.5);
    
    // Mudar cor do céu
    let color = new THREE.Color().setHSL(0.6, 0.5, Math.max(0.1, sunY * 0.5 + 0.3));
    scene.background = color;
    scene.fog.color = color;
}

// --- SISTEMA DE PARTÍCULAS (FAÍSCAS) ---
let particles = [];
function createBurst(pos, color) {
    for(let i=0; i<8; i++) {
        let p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: color}));
        p.position.copy(pos);
        p.userData = { vel: new THREE.Vector3((Math.random()-0.5)*0.2, Math.random()*0.2, (Math.random()-0.5)*0.2), life: 1.0 };
        scene.add(p);
        particles.push(p);
    }
}

// --- PLAYER, INVENTÁRIO E ANALÓGICOS ---
let moveX = 0, moveZ = 0, lookX = 0, lookY = 0;
let inventory = { madeira: 0 };
let woodUI = document.createElement("div");
woodUI.style = "position:fixed; top:20px; left:20px; color:white; font-size:24px; font-family:sans-serif; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px;";
document.body.appendChild(woodUI);

function updateUI() { woodUI.innerHTML = `🪵 Madeira: ${inventory.madeira} <br>🏆 Rank: #1`; }

// (Lógica do Analógico Esquerdo e Direito aqui - Mantida do anterior)
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
let touchIdLeft = null, startXLeft, startYLeft;
joystick.addEventListener("touchstart", e => { e.preventDefault(); const t = e.changedTouches[0]; touchIdLeft = t.identifier; startXLeft = t.clientX; startYLeft = t.clientY; }, {passive:false});
joystick.addEventListener("touchmove", e => {
    for (const t of e.changedTouches) {
        if (t.identifier !== touchIdLeft) continue;
        let dx = t.clientX - startXLeft, dy = t.clientY - startYLeft;
        let max = 50; if (Math.hypot(dx, dy) > max) { let angle = Math.atan2(dy, dx); dx = Math.cos(angle) * max; dy = Math.sin(angle) * max; }
        stick.style.transform = `translate(${dx}px,${dy}px)`; moveX = dx/50; moveZ = dy/50;
    }
}, {passive:false});
joystick.addEventListener("touchend", () => { moveX = 0; moveZ = 0; stick.style.transform = "translate(0px,0px)"; });

// --- MUNDO E ENTIDADES ---
let ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ color: 0x3d8c40 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

let player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshLambertMaterial({ color: 0x1a237e }));
player.position.y = 1; scene.add(player);

let loots = [];
function spawnWood() {
    let wood = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    wood.position.set((Math.random()-0.5)*100, 0.1, (Math.random()-0.5)*100);
    scene.add(wood); loots.push(wood);
}
setInterval(spawnWood, 3000);

// --- LOOP PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);
    updateSky();

    // Movimento
    player.position.x += moveX * 0.2;
    player.position.z += moveZ * 0.2;

    // Partículas
    particles.forEach((p, i) => {
        p.position.add(p.userData.vel);
        p.userData.life -= 0.02;
        p.scale.setScalar(p.userData.life);
        if(p.userData.life <= 0) { scene.remove(p); particles.splice(i, 1); }
    });

    // Coleta com efeito
    loots.forEach((l, i) => {
        if(player.position.distanceTo(l.position) < 2) {
            createBurst(l.position, 0x8B4513);
            scene.remove(l); loots.splice(i, 1);
            inventory.madeira += 10; updateUI();
        }
    });

    // Câmera
    camera.position.lerp(new THREE.Vector3(player.position.x + lookX*7, 8, player.position.z + 12), 0.1);
    camera.lookAt(player.position);
    renderer.render(scene, camera);
}
updateUI();
animate();

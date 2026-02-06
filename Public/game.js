// -----------------------------------------------------------
// BATTLE ROYALE COMPLETO: ÔNIBUS, CONSTRUÇÃO E LOBBY
// -----------------------------------------------------------

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ESTADOS DO JOGO
let gameState = "LOBBY"; // LOBBY, DROPSHIP, MATCH
let lobbyTimer = 5; // Tempo para o dropship aparecer
let dropshipPhase = 0; // 0=vindo, 1=parado pra pular, 2=indo embora
let playerDropped = false; // Se o jogador já pulou
let stormSize = 250;
let hp = 100;
let madeira = 0; // Recursos para construção

// LUZ E CHÃO
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
let ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ZONA (STORM)
let stormVisual = new THREE.Mesh(
    new THREE.RingGeometry(stormSize, stormSize + 5, 64),
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
);
stormVisual.rotation.x = -Math.PI / 2;
stormVisual.position.y = 0.2;
scene.add(stormVisual);

// ÔNIBUS VOADOR (DROPSHIP)
let dropship = new THREE.Mesh(
    new THREE.BoxGeometry(20, 5, 10),
    new THREE.MeshLambertMaterial({ color: 0x3333ff }) // Azul vibrante
);
dropship.position.set(-300, 50, 0); // Começa bem longe
dropship.visible = false;
scene.add(dropship);

// PLAYER E RECURSOS
let player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshLambertMaterial({ color: 0x1a237e }));
player.position.set(0, 1, 0);
scene.add(player);

// CONSTRUÇÕES
let ghostBuild = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 })
);
scene.add(ghostBuild);
let builds = []; // Array para guardar as construções

// LOOT DE MADEIRA (PARA CONSTRUIR)
let loots = [];
function spawnWood() {
    let wood = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    wood.position.set((Math.random()-0.5)*150, 0.1, (Math.random()-0.5)*150);
    scene.add(wood); loots.push(wood);
}
setInterval(spawnWood, 5000); // Madeira a cada 5s

// HUD
let hud = document.createElement("div");
hud.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); color:white; font-family:sans-serif; text-align:center; background:rgba(0,0,0,0.7); padding:15px; border-radius:10px; min-width:200px; border: 2px solid #fff; z-index:100;";
document.body.appendChild(hud);

// CONTROLES (Analógico Liso)
let moveX = 0, moveZ = 0;
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
let touchIdLeft = null, startXLeft, startYLeft;

joystick.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchIdLeft = t.identifier;
    startXLeft = t.clientX; startYLeft = t.clientY;
}, {passive: false});
joystick.addEventListener("touchmove", e => {
    for (const t of e.changedTouches) {
        if (t.identifier !== touchIdLeft) continue;
        let dx = t.clientX - startXLeft;
        let dy = t.clientY - startYLeft;
        let dist = Math.hypot(dx, dy);
        if (dist > 50) { dx *= 50/dist; dy *= 50/dist; }
        stick.style.transform = `translate(${dx}px,${dy}px)`;
        moveX = dx / 50; moveZ = dy / 50;
    }
}, {passive: false});
joystick.addEventListener("touchend", () => { moveX = 0; moveZ = 0; stick.style.transform = "translate(0px,0px)"; });

// BOTÕES DE CONSTRUÇÃO (ASSUMindo que existem no HTML)
document.getElementById("build").ontouchstart = () => {
    if (gameState === "MATCH" && madeira >= 10) {
        let b = new THREE.Mesh(ghostBuild.geometry.clone(), new THREE.MeshLambertMaterial({ color: 0x757575 }));
        b.position.copy(ghostBuild.position);
        b.rotation.copy(ghostBuild.rotation);
        scene.add(b);
        builds.push(b);
        madeira -= 10;
    }
};

// --- FUNÇÃO PARA PULAR DO ÔNIBUS ---
function jumpFromDropship() {
    if (gameState === "DROPSHIP" && !playerDropped) {
        player.position.copy(dropship.position);
        player.position.y -= 10; // Cair um pouco abaixo do ônibus
        playerDropped = true;
        gameState = "MATCH";
        dropshipPhase = 2; // Ônibus começa a ir embora
    }
}
document.addEventListener("touchstart", jumpFromDropship); // Qualquer toque para pular

// CONTAGEM REGRESSIVA DO LOBBY
let timerInterval = setInterval(() => {
    if (gameState === "LOBBY") {
        lobbyTimer--;
        if (lobbyTimer <= 0) {
            gameState = "DROPSHIP";
            dropship.visible = true;
            player.visible = false; // Esconder o player dentro do dropship
            clearInterval(timerInterval);
        }
    }
}, 1000);

// LOOP PRINCIPAL
function animate() {
    requestAnimationFrame(animate);

    // Lógica do Dropship
    if (gameState === "DROPSHIP") {
        if (dropshipPhase === 0) { // Vindo
            dropship.position.x += 0.5;
            if (dropship.position.x > 0) dropshipPhase = 1; // Parar no centro
        } else if (dropshipPhase === 1) { // Parado, esperando pular
            // HUD instrui a pular
        } else if (dropshipPhase === 2) { // Indo embora
            dropship.position.x += 1;
            if (dropship.position.x > 300) dropship.visible = false;
        }
        camera.position.set(dropship.position.x - 20, dropship.position.y + 10, dropship.position.z + 20);
        camera.lookAt(dropship.position);
        hud.innerHTML = `<b style='color:#33ff33'>SALTE DO ÔNIBUS!</b><br><small>Toque em qualquer lugar para pular!</small>`;
    }
    else { // LOBBY ou MATCH
        // Movimento do Player
        player.position.x += moveX * 0.25;
        player.position.z += moveZ * 0.25;
        
        // Câmera segue o player
        camera.position.set(player.position.x, player.position.y + 12, player.position.z + 18);
        camera.lookAt(player.position);
    }

    // Lógica do Jogo (MATCH)
    if (gameState === "MATCH") {
        player.visible = true; // Mostrar o player
        
        // Ghost Build Preview
        ghostBuild.position.set(Math.round(player.position.x/3)*3, 1.25, Math.round((player.position.z-4)/3)*3);

        // Coleta de Madeira
        loots.forEach((l, i) => {
            if (player.position.distanceTo(l.position) < 2) {
                scene.remove(l); loots.splice(i, 1);
                madeira += 10;
            }
        });

        // Fechar a Storm
        if (stormSize > 2) stormSize -= 0.08;
        stormVisual.geometry = new THREE.RingGeometry(stormSize, stormSize + 3, 64);

        // Dano da Storm
        let dist = Math.hypot(player.position.x, player.position.z);
        if (dist > stormSize) {
            hp -= 0.25;
            scene.background = new THREE.Color(0x550000);
        } else {
            scene.background = new THREE.Color(0x87ceeb);
        }
        hud.innerHTML = `<b style='color:#ff0000'>PARTIDA!</b><br>HP: ${Math.floor(hp)} | ZONA: ${Math.floor(stormSize)}m<br>🪓 Madeira: ${madeira}`;
    }
    else if (gameState === "LOBBY") {
        hud.innerHTML = `<b style='color:#ffff00'>MODO LOBBY</b><br>A partida começa em: ${lobbyTimer}s<br><small>Prepare-se!</small>`;
    }

    if (hp <= 0) { alert("VOCÊ FOI ELIMINADO!"); location.reload(); }

    renderer.render(scene, camera);
}
animate();

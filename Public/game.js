// -----------------------------------------------------------
// APEX NATURE: BATTLE ROYALE DEFINITIVO (TUDO EM UM - vFinal)
// -----------------------------------------------------------

const socket = io(); // Conexão com seu Multijogador.js
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 1. ILUMINAÇÃO E AMBIENTE
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
let sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(100, 100, 50);
sun.castShadow = true;
scene.add(sun);

// 2. TERRENO E NATUREZA (APEX NATURE STYLE)
let groundGeo = new THREE.PlaneGeometry(1000, 1000, 30, 30);
// Montanhas nas bordas
let vertices = groundGeo.attributes.position;
for (let i = 0; i < vertices.count; i++) {
    let x = vertices.getX(i), y = vertices.getY(i);
    let dist = Math.hypot(x, y);
    if (dist > 140) vertices.setZ(i, Math.random() * 15 + (dist - 140) * 0.3);
}
groundGeo.computeVertexNormals();
let ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ color: 0x3d8c40 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Gerar árvores (para coletar madeira)
let trees = [];
function spawnTrees() {
    for(let i=0; i<80; i++) {
        let tree = new THREE.Group();
        let tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2), new THREE.MeshLambertMaterial({color: 0x5d4037}));
        let folhas = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 6), new THREE.MeshLambertMaterial({color: 0x1b5e20}));
        folhas.position.y = 2; tree.add(tronco, folhas);
        tree.position.set((Math.random()-0.5)*400, 1, (Math.random()-0.5)*400);
        tree.userData = {type: "tree", hp: 50}; // Árvore tem HP
        scene.add(tree);
        trees.push(tree);
    }
}
spawnTrees();

// 3. VARIÁVEIS DE JOGO (STATUS)
let hp = 100, escudo = 50, maxEscudo = 100, madeira = 100;
let gameState = "LOBBY", lobbyTimer = 5;
let moveX = 0, moveZ = 0, isGrounded = false, velocityY = 0, gravity = -0.01;
let builds = [], bubbles = [], otherPlayers = {}, lootItems = [], chests = [];

// 4. PERSONAGEM E CONSTRUÇÃO
function createModel(color = 0x1a237e) {
    let g = new THREE.Group();
    let body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.5), new THREE.MeshLambertMaterial({color}));
    let head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({color: 0xffdbac}));
    head.position.y = 0.9; g.add(head);
    g.castShadow = true;
    return g;
}
let player = createModel(0x1a237e);
player.position.set(0, 60, 0); scene.add(player);

// Preview da construção (Fantasma)
let ghost = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.3}));
scene.add(ghost);

// 5. ÔNIBUS (DROPSHIP)
let bus = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 6), new THREE.MeshLambertMaterial({color: 0x3333ff}));
bus.position.set(-150, 60, 0); scene.add(bus);

// 6. LOOTABLES (Cofres, Medkits, Shield Pots)
function createChest(x, z) {
    let chest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1), new THREE.MeshLambertMaterial({color: 0x8B4513}));
    chest.position.set(x, 0.5, z);
    chest.userData = {type: "chest", hp: 30};
    scene.add(chest);
    chests.push(chest);
}

function createLootItem(type, x, z) {
    let item;
    if (type === "medkit") {
        item = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({color: 0xff0000}));
        item.userData = {type: "medkit", value: 30};
    } else { // Shield Pot
        item = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8), new THREE.MeshLambertMaterial({color: 0x00eaff}));
        item.userData = {type: "shieldpot", value: 25};
    }
    item.position.set(x, 0.5, z);
    scene.add(item);
    lootItems.push(item);
}

// Espalhar alguns cofres
for(let i=0; i<10; i++) {
    createChest((Math.random()-0.5)*300, (Math.random()-0.5)*300);
}

// 7. FUNÇÕES DE COMBATE E CONSTRUÇÃO
function buildWall() {
    if(madeira >= 10) {
        let wall = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), new THREE.MeshLambertMaterial({color: 0x757575}));
        wall.position.copy(ghost.position); scene.add(wall);
        builds.push(wall); madeira -= 10;
        atualizarHUD();
    }
}

function spawnBubble() {
    if(madeira >= 30) {
        let bGeo = new THREE.SphereGeometry(6, 32, 16, 0, Math.PI*2, 0, Math.PI/2);
        let bMat = new THREE.MeshPhongMaterial({color: 0x00eaff, transparent: true, opacity: 0.3, side: THREE.DoubleSide});
        let b = new THREE.Mesh(bGeo, bMat); b.position.set(player.position.x, 0, player.position.z);
        scene.add(b); bubbles.push({mesh: b, timer: 15}); madeira -= 30;
        atualizarHUD();
    }
}

function receiveDamage(amount) {
    if (escudo > 0) {
        escudo -= amount;
        if (escudo < 0) {
            hp += escudo; // Subtrai o que sobrou do dano no HP
            escudo = 0;
        }
    } else {
        hp -= amount;
    }
    atualizarHUD();
    if (hp <= 0) {
        // Lógica de eliminação
        alert("ELIMINADO!");
        location.reload();
    }
}

function updateHUD() {
    document.getElementById("health-bar").style.width = hp + "%";
    document.getElementById("shield-bar").style.width = (escudo / maxEscudo * 100) + "%";
    document.getElementById("wood-count").innerText = madeira;
}

const raycaster = new THREE.Raycaster();
function shoot() {
    let dir = new THREE.Vector3(moveX, 0, moveZ).normalize();
    if (dir.length() === 0) dir.set(0, 0, -1);
    
    // Tiro visual
    let bullet = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color: 0xffff00}));
    bullet.position.copy(player.position);
    scene.add(bullet);
    setTimeout(() => scene.remove(bullet), 500);

    // Raycasting para dano PVP e coleta
    raycaster.set(player.position, dir);
    let interactables = [...Object.values(otherPlayers), ...trees, ...chests]; // Inclui outros players, árvores e cofres
    let intersects = raycaster.intersectObjects(interactables, true);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object.parent || intersects[0].object; // Pega o grupo ou mesh
        
        if (hitObject.userData && hitObject.userData.type === "tree") {
            hitObject.userData.hp -= 10;
            madeira += 5; // Ganha madeira
            if (hitObject.userData.hp <= 0) { scene.remove(hitObject); trees.splice(trees.indexOf(hitObject), 1); }
            updateHUD();
        } else if (hitObject.userData && hitObject.userData.type === "chest") {
            hitObject.userData.hp -= 10;
            if (hitObject.userData.hp <= 0) {
                scene.remove(hitObject); chests.splice(chests.indexOf(hitObject), 1);
                // Dropa loot aleatório
                if (Math.random() < 0.5) createLootItem("medkit", hitObject.position.x, hitObject.position.z);
                else createLootItem("shieldpot", hitObject.position.x, hitObject.position.z);
            }
        } else { // Deve ser outro jogador
            let id = Object.keys(otherPlayers).find(k => otherPlayers[k] === hitObject);
            if (id) socket.emit('hit', id);
        }
    }
}

// 8. CONTROLES (HUD BOTÕES)
document.getElementById("shoot").ontouchstart = (e) => { e.preventDefault(); shoot(); };
document.getElementById("build").ontouchstart = (e) => { e.preventDefault(); buildWall(); };
document.getElementById("edit").ontouchstart = (e) => { e.preventDefault(); spawnBubble(); }; // Assumindo "edit" para a bolha
document.getElementById("jump").ontouchstart = (e) => { 
    if(gameState === "DROPSHIP") { gameState = "MATCH"; player.position.y = 50; } // Pula do ônibus
    else if(isGrounded) { velocityY = 0.2; isGrounded = false; }
};

// 9. LOGICA DE MULTIPLAYER
socket.on('state', (serverPlayers) => {
    for (let id in serverPlayers) {
        if (id === socket.id) {
            hp = serverPlayers[id].hp; // Atualiza HP local do servidor
            // Se hp <= 0, a lógica de eliminação já cuida
            continue;
        }
        if (!otherPlayers[id]) {
            otherPlayers[id] = createModel(0xff0000); // Inimigos são vermelhos
            scene.add(otherPlayers[id]);
        }
        let p = serverPlayers[id];
        otherPlayers[id].position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.2);
        otherPlayers[id].rotation.y = p.ry;
    }
    // Remover jogadores que desconectaram
    for (let id in otherPlayers) {
        if (!serverPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
    }
    updateHUD();
});
// Evento para remover players desconectados diretamente, se o servidor enviar
socket.on('removePlayer', (id) => { if(otherPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }});


// 10. LOOP PRINCIPAL (ANIMATE)
function animate() {
    requestAnimationFrame(animate);

    if (gameState === "LOBBY") {
        // ... (Mostrar "APEX NATURE" e timer)
    } else if (gameState === "DROPSHIP") {
        bus.position.x += 0.5;
        camera.position.set(bus.position.x - 20, 75, 20); camera.lookAt(bus.position);
    } else if (gameState === "MATCH") {
        // Gravidade e Movimento
        velocityY += gravity; player.position.y += velocityY;
        if (player.position.y <= 1.5) { player.position.y = 1.5; velocityY = 0; isGrounded = true; }
        
        player.position.x += moveX * 0.3; player.position.z += moveZ * 0.3;
        if (moveX !== 0 || moveZ !== 0) player.rotation.y = Math.atan2(moveX, moveZ);

        // Preview da parede
        ghost.position.set(Math.round(player.position.x/3)*3, 1.25, Math.round((player.position.z-4)/3)*3);

        // Atualizar Bolhas
        bubbles.forEach((b, i) => {
            b.timer -= 1/60; b.mesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
            if (b.timer <= 0) { scene.remove(b.mesh); bubbles.splice(i, 1); }
        });

        // Coletar itens de loot
        lootItems.forEach((item, index) => {
            if (player.position.distanceTo(item.position) < 2) {
                if (item.userData.type === "medkit") { hp = Math.min(100, hp + item.userData.value); }
                else if (item.userData.type === "shieldpot") { escudo = Math.min(maxEscudo, escudo + item.userData.value); }
                scene.remove(item); lootItems.splice(index, 1);
                updateHUD();
            }
        });

        // Enviar para Servidor
        socket.emit('move', {x: player.position.x, y: player.position.y, z: player.position.z, ry: player.rotation.y});
        
        camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y+15, player.position.z+20), 0.1);
        camera.lookAt(player.position);
    }

    renderer.render(scene, camera);
}

// Iniciar Contagem do Lobby
setInterval(() => { 
    if(gameState === "LOBBY") { 
        lobbyTimer--; 
        // Atualizar o display do lobby (assumindo que existe um elemento com ID "game-msg")
        if (document.getElementById("game-msg")) {
            document.getElementById("game-msg").innerHTML = `
                <h1 style="color: #ffff00; margin: 0; font-size: 40px;">APEX NATURE</h1>
                <p style="color: white;">Iniciando em: ${lobbyTimer}s</p>
            `;
        }
        if(lobbyTimer <= 0) gameState = "DROPSHIP"; 
    } 
}, 1000);

animate();

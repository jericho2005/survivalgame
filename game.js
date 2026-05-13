const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let animationId;
let gameRunning = false;

const worldSize = 3000;

// =========================
// PLAYER
// =========================
const player = {
    x: 0,
    y: 0,
    radius: 20,
    speed: 4,
    blades: 1,
    angle: 0
};

let bubbles = [];
let obstacles = [];
let bots = [];

// =========================
// INIT
// =========================
function init() {
    resizeCanvas();

    player.x = worldSize / 2;
    player.y = worldSize / 2;
    player.blades = 1;
    player.angle = 0;

    bubbles = [];
    obstacles = [];
    bots = [];

    for (let i = 0; i < 100; i++) spawnBubble();
    for (let i = 0; i < 60; i++) spawnObstacle();
    for (let i = 0; i < 10; i++) spawnBot();
}

// =========================
// SPAWNERS
// =========================
function spawnBubble() {
    bubbles.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        value: Math.floor(Math.random() * 3) + 1,
        radius: 15
    });
}

function spawnObstacle() {
    const level = Math.floor(Math.random() * 10) + 1;

    obstacles.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        hp: level * 5,
        maxHp: level * 5,
        level: level,
        size: 30 + level * 5
    });
}

function spawnBot() {
    bots.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        blades: Math.floor(Math.random() * 5) + 1,
        angle: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
    });
}

// =========================
// CONTROLS
// =========================
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// =========================
// DRAW BLADE
// =========================
function drawCrescent(x, y, rotation) {
    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, 15, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(5, 0);
    ctx.closePath();

    ctx.fillStyle = "#00ffcc";
    ctx.fill();

    ctx.restore();
}

// =========================
// UPDATE
// =========================
function update() {
    if (!gameRunning) return;

    // Movement
    if (keys["arrowup"] || keys["w"]) player.y -= player.speed;
    if (keys["arrowdown"] || keys["s"]) player.y += player.speed;
    if (keys["arrowleft"] || keys["a"]) player.x -= player.speed;
    if (keys["arrowright"] || keys["d"]) player.x += player.speed;

    player.angle += 0.05;

    // Bubble collision
    bubbles.forEach((bubble, index) => {
        const dist = Math.hypot(player.x - bubble.x, player.y - bubble.y);

        if (dist < player.radius + bubble.radius) {
            player.blades += bubble.value;

            bubbles.splice(index, 1);
            spawnBubble();
        }
    });

    // Blade collision
    obstacles.forEach((obs, obsIndex) => {
        const orbitRadius = 60 + player.blades * 2;

        for (let i = 0; i < player.blades; i++) {
            const bladeAngle =
                player.angle + (i * Math.PI * 2) / player.blades;

            const bx = player.x + Math.cos(bladeAngle) * orbitRadius;
            const by = player.y + Math.sin(bladeAngle) * orbitRadius;

            const d = Math.hypot(bx - obs.x, by - obs.y);

            if (d < 20 + obs.size / 2) {
                obs.hp -= 0.1;
            }
        }

        if (obs.hp <= 0) {
            obstacles.splice(obsIndex, 1);
            spawnObstacle();
        }
    });

    scoreEl.innerText = `Blades: ${player.blades}`;

    draw();

    animationId = requestAnimationFrame(update);
}

// =========================
// DRAW
// =========================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Camera
    ctx.translate(
        canvas.width / 2 - player.x,
        canvas.height / 2 - player.y
    );

    // Grid
    ctx.strokeStyle = "#333";

    for (let i = 0; i <= worldSize; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, worldSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(worldSize, i);
        ctx.stroke();
    }

    // Bubbles
    bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        ctx.fillStyle = "rgba(0,255,200,0.3)";
        ctx.fill();

        ctx.strokeStyle = "#00ffcc";
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.fillText(b.value, b.x - 3, b.y + 3);
    });

    // Obstacles
    obstacles.forEach((o) => {
        ctx.fillStyle = `hsl(${200 - o.level * 20}, 70%, 50%)`;

        ctx.fillRect(
            o.x - o.size / 2,
            o.y - o.size / 2,
            o.size,
            o.size
        );

        ctx.fillStyle = "white";
        ctx.fillText(`LVL ${o.level}`, o.x - 15, o.y);
    });

    // Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#ff0066";
    ctx.fill();

    // Blades
    const orbitRadius = 60 + player.blades * 2;

    for (let i = 0; i < player.blades; i++) {
        const bladeAngle =
            player.angle + (i * Math.PI * 2) / player.blades;

        const bx = player.x + Math.cos(bladeAngle) * orbitRadius;
        const by = player.y + Math.sin(bladeAngle) * orbitRadius;

        drawCrescent(bx, by, bladeAngle + Math.PI / 2);
    }

    ctx.restore();
}

// =========================
// START GAME
// =========================
function startGame() {
    menu.style.display = "none";

    gameRunning = true;

    init();

    cancelAnimationFrame(animationId);

    update();
}

startBtn.addEventListener("click", startGame);

// =========================
// RESIZE
// =========================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
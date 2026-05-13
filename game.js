const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let animationId;
let gameRunning = false;

const worldSize = 3000;

const swordLevels = [
    {
        level: 1,
        color: "#00ffcc",
        size: 12,
        damage: 0.1,
        speed: 0.05
    },

    {
        level: 2,
        color: "#00aaff",
        size: 16,
        damage: 0.2,
        speed: 0.07
    },

    {
        level: 3,
        color: "#aa00ff",
        size: 20,
        damage: 0.35,
        speed: 0.1
    },

    {
        level: 4,
        color: "#ff0033",
        size: 25,
        damage: 0.5,
        speed: 0.14
    },

    {
        level: 5,
        color: "#ffd700",
        size: 32,
        damage: 1,
        speed: 0.18
    }
];

function getSwordLevel(blades) {

    if (blades < 10) return swordLevels[0];
    if (blades < 25) return swordLevels[1];
    if (blades < 50) return swordLevels[2];
    if (blades < 100) return swordLevels[3];

    return swordLevels[4];
}

// =========================
// PLAYER
// =========================



const enemyImages = [];

for (let i = 1; i <= 3; i++) {
    const img = new Image();
    img.src = `assets/E${i}.png`;
    enemyImages.push(img);
}

const playerImage = new Image();
playerImage.src = "assets/AG.png";

const player = {
    x: 0,
    y: 0,
    radius: 40,
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
        vy: (Math.random() - 0.5) * 2,

        radius: 35,

        image:
            enemyImages[
                Math.floor(Math.random() * enemyImages.length)
            ]
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
function drawCrescent(x, y, rotation, swordData) {

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        swordData.size,
        0.2 * Math.PI,
        1.8 * Math.PI
    );

    ctx.lineTo(5, 0);

    ctx.closePath();

    // Glow
    ctx.shadowColor = swordData.color;
    ctx.shadowBlur = 20;

    ctx.fillStyle = swordData.color;
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

    const playerSword = getSwordLevel(player.blades);

    player.angle += playerSword.speed;

    // =========================
    // BOT MOVEMENT
    // =========================
    bots.forEach((bot) => {

        bot.x += bot.vx;
        bot.y += bot.vy;

        bot.angle += 0.03;

        // Bounce off world edges
        if (bot.x < 0 || bot.x > worldSize) {
            bot.vx *= -1;
        }

        if (bot.y < 0 || bot.y > worldSize) {
            bot.vy *= -1;
        }
    });

    // =========================
// PLAYER VS BOTS
// =========================
bots.forEach((bot, botIndex) => {

    const dist = Math.hypot(
        player.x - bot.x,
        player.y - bot.y
    );

    // Player stronger
    if (
        dist < 60 &&
        player.blades > bot.blades
    ) {

        player.blades += bot.blades;

        bots.splice(botIndex, 1);

        spawnBot();
    }

    // Enemy stronger
    else if (
        dist < 60 &&
        bot.blades > player.blades
    ) {

        alert("GAME OVER");

        location.reload();
    }
});

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
                obs.hp -= playerSword.damage;
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

    // =========================
// DRAW BOTS
// =========================
bots.forEach((bot) => {

    const size = 70;

    ctx.save();

    ctx.beginPath();
    ctx.arc(bot.x, bot.y, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
        bot.image,
        bot.x - size / 2,
        bot.y - size / 2,
        size,
        size
    );

    ctx.restore();

    // Enemy blades
    const orbitRadius = 60 + bot.blades * 2;
    const botSword = getSwordLevel(bot.blades);

    for (let i = 0; i < bot.blades; i++) {

        const bladeAngle =
            bot.angle +
            (i * Math.PI * 2 / bot.blades);

        const bx =
            bot.x +
            Math.cos(bladeAngle) * orbitRadius;

        const by =
            bot.y +
            Math.sin(bladeAngle) * orbitRadius;

        drawCrescent(
            bx,
            by,
            bladeAngle + Math.PI / 2,
            botSword
        );
    }
});

    // Draw Player Image
    const playerSize = 80;

        ctx.save();

        ctx.beginPath();
        ctx.arc(player.x, player.y, playerSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
            playerImage,
            player.x - playerSize / 2,
            player.y - playerSize / 2,
            playerSize,
            playerSize
        );

        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 4;
        ctx.stroke();

ctx.restore();

    // Blades
    const orbitRadius = 60 + player.blades * 2;

    const playerSword = getSwordLevel(player.blades);

    for (let i = 0; i < player.blades; i++) {

        const bladeAngle =
            player.angle + (i * Math.PI * 2) / player.blades;

        const bx =
            player.x + Math.cos(bladeAngle) * orbitRadius;

        const by =
            player.y + Math.sin(bladeAngle) * orbitRadius;

        drawCrescent(
            bx,
            by,
            bladeAngle + Math.PI / 2,
            playerSword
        );
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
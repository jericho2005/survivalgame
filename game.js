const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let animationId;
let gameRunning = false;
let trailParticles = [];
let hitSparks = [];
let lightningEffects = [];

function getTotalBladePower() {

    let total = 0;

    for (let lvl in player.inventory) {

        total +=
            player.inventory[lvl] *
            Number(lvl);
    }

    return total;
}


const slashSounds = [

    new Audio("assets/audio/slash1.ogg"),
    new Audio("assets/audio/slash2.ogg"),
    new Audio("assets/audio/slash1.wav")

];

const hitSound =
    new Audio("assets/audio/hit.wav");

function playSlashSound() {

    const sound =
        slashSounds[
            Math.floor(
                Math.random() *
                slashSounds.length
            )
        ];

    // Clone so sounds can overlap
    const s = sound.cloneNode();

    s.volume = 0.25;

    s.play();
}

function createTrail(x, y, color) {

    trailParticles.push({
        x,
        y,

        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,

        life: 8,
        maxLife: 8,

        size: Math.random() * 3 + 1,

        color
    });
}

function createHitSparks(x, y, color) {

    for (let i = 0; i < 15; i++) {

        hitSparks.push({
            x,
            y,

            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,

            size: Math.random() * 5 + 2,

            life: 30,
            maxLife: 30,

            color
        });
    }
}

function createLightning(x1, y1, x2, y2, color) {

    lightningEffects.push({
        x1,
        y1,
        x2,
        y2,

        color,

        life: 6
    });
}

const worldSize = 3000;

const swordLevels = [

    {
        level: 1,
        color: "#ffffff",
        size: 10,
        damage: 1,
        requirement: 10
    },

    {
        level: 2,
        color: "#d8f3ff",
        size: 12,
        damage: 2,
        requirement: 15
    },

    {
        level: 3,
        color: "#9be7ff",
        size: 14,
        damage: 4,
        requirement: 20
    },

    {
        level: 4,
        color: "#5ab8ff",
        size: 16,
        damage: 7,
        requirement: 25
    },

    {
        level: 5,
        color: "#2d7dff",
        size: 18,
        damage: 11,
        requirement: 30
    },

    {
        level: 6,
        color: "#4b3dff",
        size: 21,
        damage: 16,
        requirement: 35
    },

    {
        level: 7,
        color: "#3a1b7a",
        size: 24,
        damage: 23,
        requirement: 40
    },

    {
        level: 8,
        color: "#240046",
        size: 28,
        damage: 32,
        requirement: 50
    },

    {
        level: 9,
        color: "#14001f",
        size: 34,
        damage: 50,
        requirement: Infinity
    }

];

function mergeBlades() {

    for (let lvl = 1; lvl < swordLevels.length; lvl++) {

        const data =
            swordLevels[lvl - 1];

        const nextLevel = lvl + 1;

        if (
            player.inventory[lvl] >=
            data.requirement
        ) {

            player.inventory[lvl] -=
                data.requirement;

            if (!player.inventory[nextLevel]) {
                player.inventory[nextLevel] = 0;
            }

            player.inventory[nextLevel]++;

            mergeBlades();
        }
    }
}

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
    img.src = `assets/images/E${i}.png`;
    enemyImages.push(img);
}

const playerImage = new Image();
playerImage.src = "assets/images/AG.png";

const player = {
    x: 0,
    y: 0,
    radius: 40,
    speed: 4,
    inventory: {
    1: 1
    },
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
    player.inventory = {
        1: 1
    };
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

    const level =
        Math.floor(Math.random() * 10) + 1;

    // Random value based on level
    const value =
        Math.floor(
            Math.random() *
            (level * 20)
        ) + level * 10;

    obstacles.push({

        x: Math.random() * worldSize,
        y: Math.random() * worldSize,

        level,

        value,

        size: 35 + value * 0.08
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

    // Long thin crescent settings
    const outerRadius = swordData.size * 2.2;
    const innerRadius = swordData.size * 1.9;

    // Offset controls thickness
    const offsetX = swordData.size * 1.1;

    // Glow
    ctx.shadowColor = swordData.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();

    // Outer curve
    ctx.arc(
        0,
        0,
        outerRadius,
        0.35 * Math.PI,
        1.65 * Math.PI,
        false
    );

    // Inner curve
    ctx.arc(
        offsetX,
        0,
        innerRadius,
        1.65 * Math.PI,
        0.35 * Math.PI,
        true
    );

    ctx.closePath();

    // Fill
    ctx.fillStyle = swordData.color;
    ctx.fill();

    // Black outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.stroke();

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

    const playerSword =
    getSwordLevel(getTotalBladePower());

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
// BLADE VS BLADE COLLISION
// =========================

for (let botIndex = bots.length - 1; botIndex >= 0; botIndex--) {

    const bot = bots[botIndex];

    const playerOrbit =
        60 + getTotalBladePower() * 2;

    const botOrbit =
        60 + bot.blades * 2;

    const playerSword =
        getSwordLevel(player.blades);

    const botSword =
        getSwordLevel(bot.blades);

    let collisionHappened = false;

    // Player blades
    for (let i = 0; i < getTotalBladePower(); i++) {

        const playerAngle =
            player.angle +
            (i * Math.PI * 2 / player.blades);

        const px =
            player.x +
            Math.cos(playerAngle) * playerOrbit;

        const py =
            player.y +
            Math.sin(playerAngle) * playerOrbit;

        // Bot blades
        for (let j = 0; j < bot.blades; j++) {

            const botAngle =
                bot.angle +
                (j * Math.PI * 2 / bot.blades);

            const bx =
                bot.x +
                Math.cos(botAngle) * botOrbit;

            const by =
                bot.y +
                Math.sin(botAngle) * botOrbit;

            const dist =
                Math.hypot(px - bx, py - by);

            // Blade hit
            if (dist < 20) {

                playSlashSound();
                collisionHappened = true;

                

                createHitSparks(
                    (px + bx) / 2,
                    (py + by) / 2,
                    playerSword.color
                );

                createLightning(
                    px,
                    py,
                    bx,
                    by,
                    playerSword.level >= botSword.level
                        ? playerSword.color
                        : botSword.color
                );

                // SAME LEVEL
                if (
                    playerSword.level ===
                    botSword.level
                ) {

                    player.blades =
                        Math.max(1, player.blades - 1);

                    bot.blades =
                        Math.max(1, bot.blades - 1);
                }

                // PLAYER STRONGER
                else if (
                    playerSword.level >
                    botSword.level
                ) {

                    bot.blades =
                        Math.max(1, bot.blades - 1);
                }

                // BOT STRONGER
                else {

                    player.blades =
                        Math.max(1, player.blades - 1);
                }

                break;
            }
        }

        if (collisionHappened) break;
    }

    // Remove dead bot
    if (bot.blades <= 0) {

        createLightning(
            player.x,
            player.y,
            bot.x,
            bot.y,
            playerSword.color
        );

        bots.splice(botIndex, 1);

        spawnBot();
    }

    // Game over
    if (player.blades <= 0) {

        alert("GAME OVER");

        location.reload();
    }
}

// =========================
// BLADE VS BOTS
// =========================

for (let botIndex = bots.length - 1; botIndex >= 0; botIndex--) {

    const bot = bots[botIndex];

    const orbitRadius = 60 + getTotalBladePower() * 2;

    for (let i = 0; i < getTotalBladePower(); i++) {

        const bladeAngle =
            player.angle +
            (i * Math.PI * 2 / player.blades);

        const bx =
            player.x +
            Math.cos(bladeAngle) * orbitRadius;

        const by =
            player.y +
            Math.sin(bladeAngle) * orbitRadius;

        const dist = Math.hypot(
            bx - bot.x,
            by - bot.y
        );

        // Blade edge touches enemy
        if (dist < bot.radius + 10) {

            // Stronger player wins
            if (getTotalBladePower() >= bot.blades) {

                player.blades += bot.blades;

                createHitSparks(
                    bot.x,
                    bot.y,
                    playerSword.color
                );

                if (bot.blades >= 10) {

                createLightning(
                    player.x,
                    player.y,
                    bot.x,
                    bot.y,
                    playerSword.color
                );
            }

                bots.splice(botIndex, 1);

                spawnBot();
            }
            else {

                alert("GAME OVER");

                location.reload();
            }

            break;
        }
    }
}

// Bubble collision
bubbles.forEach((bubble, index) => {

    const dist = Math.hypot(
        player.x - bubble.x,
        player.y - bubble.y
    );

    if (dist < player.radius + bubble.radius) {

        player.inventory[1] += bubble.value;

        mergeBlades();

        bubbles.splice(index, 1);

        spawnBubble();
    }
});

    // =========================
// BLADE VS OBSTACLES
// =========================

obstacles.forEach((obs, obsIndex) => {

    const orbitRadius =
        60 + getTotalBladePower() * 2;

    for (let i = 0; i < getTotalBladePower(); i++) {

        const bladeAngle =
            player.angle +
            (i * Math.PI * 2) / player.blades;

        const bx =
            player.x +
            Math.cos(bladeAngle) * orbitRadius;

        const by =
            player.y +
            Math.sin(bladeAngle) * orbitRadius;

        const d =
            Math.hypot(
                bx - obs.x,
                by - obs.y
            );

        // Blade touches obstacle
        if (d < obs.size / 2 + 12) {

            hitSound.currentTime = 0;
            hitSound.volume = 0.2;
            hitSound.play();

            // Minus obstacle number
            obs.value -= 1;

            createHitSparks(
                bx,
                by,
                playerSword.color
            );
        }
    }

    // Destroy obstacle
    if (obs.value <= 0) {

        createLightning(
            player.x,
            player.y,
            obs.x,
            obs.y,
            playerSword.color
        );

        obstacles.splice(obsIndex, 1);

        spawnObstacle();
    }
});

    // =========================
    // UPDATE PARTICLES
    // =========================

    trailParticles.forEach((p, index) => {

        p.x += p.vx;
        p.y += p.vy;

        p.life--;

        if (p.life <= 0) {
            trailParticles.splice(index, 1);
        }
    });

    hitSparks.forEach((p, index) => {

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.96;
        p.vy *= 0.96;

        p.life--;

        if (p.life <= 0) {
            hitSparks.splice(index, 1);
        }
    });

    lightningEffects.forEach((l, index) => {

        l.life--;

        if (l.life <= 0) {
            lightningEffects.splice(index, 1);
        }
    });

    scoreEl.innerText = `Power: ${getTotalBladePower()}`;

    draw();

    animationId = requestAnimationFrame(update);
}

// =========================
// DRAW
// =========================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    ctx.save();

        // =========================
        // DYNAMIC CAMERA ZOOM
        // =========================

        // More blades = more zoom out
        let zoom = 1 - (player.blades * 0.003);

        // Clamp zoom
        zoom = Math.max(0.35, zoom);

        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.scale(zoom, zoom);

        ctx.translate(-player.x, -player.y);

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
        ctx.fillStyle = `hsl(${120 - o.level * 8}, 80%, 45%)`;

        ctx.fillRect(
            o.x - o.size / 2,
            o.y - o.size / 2,
            o.size,
            o.size
        );

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";

        ctx.fillStyle = "white";

        ctx.textAlign = "center";

        ctx.fillText(
            o.value,
            o.x,
            o.y + 6
        );
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

        if (Math.random() < 0.15) {

            createTrail(
                bx,
                by,
                botSword.color
            );
        }
    }
});

    // =========================
    // DRAW TRAILS
    // =========================
    trailParticles.forEach((p) => {

        const alpha = p.life / p.maxLife;

        ctx.globalAlpha = alpha;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = p.color;

        ctx.fill();

        ctx.globalAlpha = 1;
    });

    // =========================
    // DRAW SPARKS
    // =========================
    hitSparks.forEach((p) => {

        const alpha = p.life / p.maxLife;

        ctx.globalAlpha = alpha;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = p.color;

        ctx.fill();

        ctx.globalAlpha = 1;
    });

    // =========================
    // DRAW LIGHTNING
    // =========================
    lightningEffects.forEach((l) => {

        ctx.strokeStyle = l.color;

        ctx.lineWidth = 3;

        ctx.shadowBlur = 8;
        ctx.shadowColor = l.color;

        ctx.beginPath();

        ctx.moveTo(l.x1, l.y1);

        // Jagged lightning
        for (let i = 1; i < 6; i++) {

            const t = i / 6;

            const x =
                l.x1 + (l.x2 - l.x1) * t +
                (Math.random() - 0.5) * 30;

            const y =
                l.y1 + (l.y2 - l.y1) * t +
                (Math.random() - 0.5) * 30;

            ctx.lineTo(x, y);
        }

        ctx.lineTo(l.x2, l.y2);

        ctx.stroke();
    });

    // =========================
    // DRAW ANIMATED PLAYER
    // =========================

    function drawPlayerCharacter() {

        const bodyBob =
            Math.sin(Date.now() * 0.01) * 2;

        const walkSwing =
            Math.sin(Date.now() * 0.02) * 10;

        // BODY
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        // Body
        ctx.beginPath();

        ctx.moveTo(player.x, player.y + 20 + bodyBob);
        ctx.lineTo(player.x, player.y + 55 + bodyBob);

        ctx.stroke();

        // Arms
        ctx.beginPath();

        ctx.moveTo(player.x - 15, player.y + 35 + bodyBob);
        ctx.lineTo(player.x + 15, player.y + 35 + bodyBob);

        ctx.stroke();

        // Left leg
        ctx.beginPath();

        ctx.moveTo(player.x, player.y + 55 + bodyBob);

        ctx.lineTo(
            player.x - 12,
            player.y + 80 + walkSwing * 0.2 + bodyBob
        );

        ctx.stroke();

        // Right leg
        ctx.beginPath();

        ctx.moveTo(player.x, player.y + 55 + bodyBob);

        ctx.lineTo(
            player.x + 12,
            player.y + 80 - walkSwing * 0.2 + bodyBob
        );

        ctx.stroke();

        // HEAD
        const headSize = 42;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            headSize / 2,
            0,
            Math.PI * 2
        );

        ctx.closePath();

        ctx.clip();

        ctx.drawImage(
            playerImage,
            player.x - headSize / 2,
            player.y - headSize / 2,
            headSize,
            headSize
        );

        ctx.restore();

        // Head outline
        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            headSize / 2,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 3;

        ctx.stroke();
    }
    drawPlayerCharacter();
}    
    // =========================
// MULTI-RING BLADE SYSTEM
// =========================

let ring = 0;

for (let level = 1; level <= 9; level++) {

    const amount =
        player.inventory[level] || 0;

    if (amount <= 0) continue;

    const sword =
        swordLevels[level - 1];

    // Ring distance
    const orbitRadius =
        120 + ring * 70;

    for (let i = 0; i < amount; i++) {

        const bladeAngle =
            player.angle +
            (i * Math.PI * 2 / amount);

        const bx =
            player.x +
            Math.cos(bladeAngle) * orbitRadius;

        const by =
            player.y +
            Math.sin(bladeAngle) * orbitRadius;

        drawCrescent(
            bx,
            by,
            bladeAngle + Math.PI / 2,
            sword
        );
    }

    ring++;
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
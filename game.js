// =========================
// PLAYER BLADES STORAGE
// =========================

let playerBlades = [];

// =========================
// INIT
// =========================

function init() {

    resizeCanvas();

    player.x = worldSize / 2;
    player.y = worldSize / 2;

    // REAL blade objects
    playerBlades = [
        { level: 1 }
    ];

    player.angle = 0;

    bubbles = [];
    obstacles = [];
    bots = [];

    for (let i = 0; i < 100; i++) spawnBubble();
    for (let i = 0; i < 60; i++) spawnObstacle();
    for (let i = 0; i < 10; i++) spawnBot();
}

// =========================
// GET TOTAL POWER
// =========================

function getTotalBladePower() {

    return playerBlades.length;
}

// =========================
// ADD BLADE
// =========================

function addBlade(level = 1) {

    playerBlades.push({
        level
    });
}

// =========================
// CONTROLS + CHEAT
// =========================

window.addEventListener("keydown", (e) => {

    keys[e.key.toLowerCase()] = true;

    // F11 CHEAT
    if (e.key === "F11") {

        e.preventDefault();

        playerBlades = [];

        // 100 MAX BLADES
        for (let i = 0; i < 100; i++) {

            playerBlades.push({
                level: 9
            });
        }

        console.log("CHEAT ACTIVATED");
    }
});

window.addEventListener("keyup", (e) => {

    keys[e.key.toLowerCase()] = false;
});

// =========================
// SPAWN BOT
// =========================

function spawnBot() {

    const bladeCount =
        Math.floor(Math.random() * 5) + 1;

    let bladeObjects = [];

    for (let i = 0; i < bladeCount; i++) {

        bladeObjects.push({
            level: bladeCount
        });
    }

    bots.push({

        x: Math.random() * worldSize,
        y: Math.random() * worldSize,

        blades: bladeCount,

        bladeObjects,

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
// PLAYER VS BOT BLADES
// =========================

for (let botIndex = bots.length - 1; botIndex >= 0; botIndex--) {

    const bot = bots[botIndex];

    const playerOrbit =
        120 + playerBlades.length * 2;

    const botOrbit =
        60 + bot.bladeObjects.length * 2;

    // PLAYER BLADES
    for (let i = playerBlades.length - 1; i >= 0; i--) {

        const playerBlade =
            playerBlades[i];

        const playerSword =
            swordLevels[playerBlade.level - 1];

        const playerAngle =
            player.angle +
            (i * Math.PI * 2 / playerBlades.length);

        const px =
            player.x +
            Math.cos(playerAngle) * playerOrbit;

        const py =
            player.y +
            Math.sin(playerAngle) * playerOrbit;

        // BOT BLADES
        for (let j = bot.bladeObjects.length - 1; j >= 0; j--) {

            const enemyBlade =
                bot.bladeObjects[j];

            const enemySword =
                swordLevels[enemyBlade.level - 1];

            const botAngle =
                bot.angle +
                (j * Math.PI * 2 / bot.bladeObjects.length);

            const bx =
                bot.x +
                Math.cos(botAngle) * botOrbit;

            const by =
                bot.y +
                Math.sin(botAngle) * botOrbit;

            const dist =
                Math.hypot(px - bx, py - by);

            // COLLISION
            if (dist < 22) {

                playSlashSound();

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
                    playerSword.color
                );

                // PLAYER STRONGER
                if (playerBlade.level > enemyBlade.level) {

                    bot.bladeObjects.splice(j, 1);
                }

                // BOT STRONGER
                else if (enemyBlade.level > playerBlade.level) {

                    playerBlades.splice(i, 1);
                }

                // SAME LEVEL
                else {

                    playerBlades.splice(i, 1);

                    bot.bladeObjects.splice(j, 1);
                }

                // UPDATE BOT COUNT
                bot.blades =
                    bot.bladeObjects.length;

                // BOT DEAD
                if (bot.bladeObjects.length <= 0) {

                    createLightning(
                        player.x,
                        player.y,
                        bot.x,
                        bot.y,
                        "#00ffff"
                    );

                    bots.splice(botIndex, 1);

                    spawnBot();
                }

                // PLAYER DEAD
                if (playerBlades.length <= 0) {

                    gameOver();
                }

                break;
            }
        }
    }
}

// =========================
// BUBBLE COLLISION
// =========================

bubbles.forEach((bubble, index) => {

    const dist = Math.hypot(
        player.x - bubble.x,
        player.y - bubble.y
    );

    if (dist < player.radius + bubble.radius) {

        for (let i = 0; i < bubble.value; i++) {

            addBlade(1);
        }

        bubbles.splice(index, 1);

        spawnBubble();
    }
});

// =========================
// DRAW PLAYER BLADES
// =========================

const orbitRadius =
    120 + playerBlades.length * 2;

for (let i = 0; i < playerBlades.length; i++) {

    const blade =
        playerBlades[i];

    const sword =
        swordLevels[blade.level - 1];

    const bladeAngle =
        player.angle +
        (i * Math.PI * 2 / playerBlades.length);

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

    // TRAIL
    if (Math.random() < 0.15) {

        createTrail(
            bx,
            by,
            sword.color
        );
    }
}

// =========================
// DRAW BOT BLADES
// =========================

bots.forEach((bot) => {

    const orbitRadius =
        60 + bot.bladeObjects.length * 2;

    for (let i = 0; i < bot.bladeObjects.length; i++) {

        const blade =
            bot.bladeObjects[i];

        const sword =
            swordLevels[blade.level - 1];

        const bladeAngle =
            bot.angle +
            (i * Math.PI * 2 / bot.bladeObjects.length);

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
            sword
        );
    }
});
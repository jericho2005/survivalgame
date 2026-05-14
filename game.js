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

    const worldSize = 3000;

    // =========================
    // AUDIO
    // =========================

    const slashSounds = [
        new Audio("assets/audio/slash1.ogg"),
        new Audio("assets/audio/slash2.ogg"),
        new Audio("assets/audio/slash1.wav")
    ];

    const hitSound = new Audio("assets/audio/hit.wav");

    function playSlashSound() {
        const sound =
            slashSounds[
                Math.floor(Math.random() * slashSounds.length)
            ];

        const s = sound.cloneNode();

        s.volume = 1;
        s.play();
    }

    // =========================
    // SWORD DATA
    // =========================

    const swordLevels = [
        {
            level: 1,
            color: "#ffffff",
            size: 10,
            damage: 1,
            speed: 0.05,
            requirement: 10
        },

        {
            level: 2,
            color: "#EE82EE",
            size: 12,
            damage: 2,
            speed: 0.06,
            requirement: 15
        },

        {
            level: 3,
            color: "#F0E68C",
            size: 14,
            damage: 4,
            speed: 0.07,
            requirement: 20
        },

        {
            level: 4,
            color: "#FF7F50",
            size: 16,
            damage: 7,
            speed: 0.08,
            requirement: 25
        },

        {
            level: 5,
            color: "#FFFF00",
            size: 18,
            damage: 11,
            speed: 0.09,
            requirement: 30
        },

        {
            level: 6,
            color: "#FF4500",
            size: 21,
            damage: 16,
            speed: 0.10,
            requirement: 35
        },

        {
            level: 7,
            color: "#4682B4",
            size: 24,
            damage: 23,
            speed: 0.15,
            requirement: 40
        },

        {
            level: 8,
            color: "#00FF00",
            size: 28,
            damage: 32,
            speed: 0.25,
            requirement: 50
        },

        {
            level: 9,
            color: "#FF0000",
            size: 18,
            damage: 50,
            speed: 0.30,
            requirement: 100
        }
    ];

    // =========================
    // PLAYER
    // =========================

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

    // =========================
    // BACKGROUND
    // =========================

    const grassBg = new Image();
    grassBg.src = "assets/images/FIELD.jpg";
    // =========================
    // IMAGES
    // =========================

    const enemyImages = [];

    for (let i = 1; i <= 3; i++) {
        const img = new Image();
        img.src = `assets/images/E${i}.png`;
        enemyImages.push(img);
    }

    const playerImage = new Image();
    playerImage.src = "assets/images/AG.png";

    // =========================
    // GAME OBJECTS
    // =========================

    let bubbles = [];
    let obstacles = [];
    let bots = [];

    // =========================
    // HELPERS
    // =========================

    function getTotalBladePower() {

        let total = 0;

        for (let lvl in player.inventory) {
            total += player.inventory[lvl] * Number(lvl);
        }

        return total;
    }

    function getSwordLevel(blades) {

        if (blades < 10) return swordLevels[0];
        if (blades < 25) return swordLevels[1];
        if (blades < 50) return swordLevels[2];
        if (blades < 100) return swordLevels[3];

        return swordLevels[4];
    }

    function mergeBlades() {

        for (let lvl = 1; lvl < swordLevels.length; lvl++) {

            const data = swordLevels[lvl - 1];
            const nextLevel = lvl + 1;

            if (player.inventory[lvl] >= data.requirement) {

                player.inventory[lvl] -= data.requirement;

                if (!player.inventory[nextLevel]) {
                    player.inventory[nextLevel] = 0;
                }

                player.inventory[nextLevel]++;

                mergeBlades();
            }
        }
    }

    // =========================
    // EFFECTS
    // =========================

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

        const value =
            Math.floor(Math.random() * (level * 20)) +
            level * 10;

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
    // CONTROLS
    // =========================

    const keys = {};

    window.addEventListener("keydown", (e) => {

        keys[e.key.toLowerCase()] = true;

        // =========================
        // CHEAT CODE - F11
        // =========================

        if (e.key === "F11") {

            e.preventDefault();

            // 100 max blades only
            player.inventory = {

                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0,
                8: 0,

                // 100 level 9 blades
                9: 100
            };

            console.log("CHEAT ACTIVATED");
        }
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // =========================
    // DRAW CRESCENT
    // =========================

    function drawCrescent(x, y, rotation, swordData) {

        ctx.save();

        ctx.translate(x, y);
        ctx.rotate(rotation);

        const outerRadius = swordData.size * 2.2;
        const innerRadius = swordData.size * 1.9;

        const offsetX = swordData.size * 1.1;

        ctx.shadowColor = swordData.color;
        ctx.shadowBlur = 6;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            outerRadius,
            0.35 * Math.PI,
            1.65 * Math.PI,
            false
        );

        ctx.arc(
            offsetX,
            0,
            innerRadius,
            1.65 * Math.PI,
            0.35 * Math.PI,
            true
        );

        ctx.closePath();

        ctx.fillStyle = swordData.color;
        ctx.fill();

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

        player.angle += playerSword.speed || 0.05;

        // Bot movement
        bots.forEach((bot) => {

            bot.x += bot.vx;
            bot.y += bot.vy;

            bot.angle += 0.03;

            if (bot.x < 0 || bot.x > worldSize) {
                bot.vx *= -1;
            }

            if (bot.y < 0 || bot.y > worldSize) {
                bot.vy *= -1;
            }
        });

        // =========================
        // PLAYER BLADES VS BOT BLADES
        // =========================

        for (let botIndex = bots.length - 1; botIndex >= 0; botIndex--) {

            const bot = bots[botIndex];

            // PLAYER BLADES
            let playerBlades = [];

            for (let level = 1; level <= 9; level++) {

                const amount =
                    player.inventory[level] || 0;

                const sword =
                    swordLevels[level - 1];

                for (let i = 0; i < amount; i++) {

                    playerBlades.push({
                        level,
                        sword
                    });
                }
            }

            // BOT BLADES
            let botBlades = [];

            const botSword =
                getSwordLevel(bot.blades);

            for (let i = 0; i < bot.blades; i++) {

                botBlades.push({
                    sword: botSword
                });
            }

            const playerOrbit =
                120 + playerBlades.length * 2;

            const botOrbit =
                60 + bot.blades * 2;

            let botDead = false;

            // =========================
            // COLLISION CHECK
            // =========================

            for (let i = 0; i < playerBlades.length; i++) {

                const playerBlade =
                    playerBlades[i];

                const playerAngle =
                    player.angle +
                    (i * Math.PI * 2 / playerBlades.length);

                const px =
                    player.x +
                    Math.cos(playerAngle) * playerOrbit;

                const py =
                    player.y +
                    Math.sin(playerAngle) * playerOrbit;

                for (let j = 0; j < botBlades.length; j++) {

                    const enemyBlade =
                        botBlades[j];

                    const botAngle =
                        bot.angle +
                        (j * Math.PI * 2 / botBlades.length);

                    const bx =
                        bot.x +
                        Math.cos(botAngle) * botOrbit;

                    const by =
                        bot.y +
                        Math.sin(botAngle) * botOrbit;

                    const dist =
                        Math.hypot(px - bx, py - by);

                    // Blade hit
                    if (dist < 25) {

                        playSlashSound();

                        createHitSparks(
                            (px + bx) / 2,
                            (py + by) / 2,
                            playerBlade.sword.color
                        );

                        createLightning(
                            px,
                            py,
                            bx,
                            by,
                            playerBlade.sword.color
                        );

                        const playerPower =
                            playerBlade.sword.damage;

                        const botPower =
                            enemyBlade.sword.damage;

                        // =========================
                        // PLAYER WINS
                        // =========================

                        if (
                            playerPower > botPower ||
                            player.inventory[9] >= 100
                        ) {

                            bot.blades--;

                            // Gain 1 blade
                            player.inventory[1]++;

                            mergeBlades();
                        }

                        // =========================
                        // BOT WINS
                        // =========================

                        else if (botPower > playerPower) {

                            // Remove weakest player blade
                            for (let lvl = 1; lvl <= 9; lvl++) {

                                if (player.inventory[lvl] > 0) {

                                    player.inventory[lvl]--;

                                    break;
                                }
                            }
                        }

                        // =========================
                        // SAME POWER
                        // =========================

                        else {

                            bot.blades--;

                            for (let lvl = 1; lvl <= 9; lvl++) {

                                if (player.inventory[lvl] > 0) {

                                    player.inventory[lvl]--;

                                    break;
                                }
                            }
                        }

                        // BOT DEAD
                        if (bot.blades <= 0) {

                            createLightning(
                                player.x,
                                player.y,
                                bot.x,
                                bot.y,
                                "#00ffff"
                            );

                            bots.splice(botIndex, 1);

                            spawnBot();

                            botDead = true;
                        }

                        // PLAYER DEAD
                        if (getTotalBladePower() <= 0) {

                            gameOver();
                        }

                        break;
                    }
                }

                if (botDead) break;
            }
        }

        // =========================
        // PLAYER VS OBSTACLES
        // =========================

        obstacles.forEach((obs, obsIndex) => {

            const orbitRadius =
                120 + getTotalBladePower() * 2;

            for (let level = 1; level <= 9; level++) {

                const amount =
                    player.inventory[level] || 0;

                if (amount <= 0) continue;

                const sword =
                    swordLevels[level - 1];

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

                    const dist =
                        Math.hypot(
                            bx - obs.x,
                            by - obs.y
                        );

                    if (dist < obs.size / 2 + 12) {

                        hitSound.currentTime = 0;
                        hitSound.volume = 0.2;
                        hitSound.play();

                        obs.value--;

                        createHitSparks(
                            bx,
                            by,
                            sword.color
                        );
                    }
                }
            }

            // Destroy obstacle
            if (obs.value <= 0) {

                createLightning(
                    player.x,
                    player.y,
                    obs.x,
                    obs.y,
                    "#00ffff"
                );

                obstacles.splice(obsIndex, 1);

                spawnObstacle();
            }
        });

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

        // Update particles
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

        scoreEl.innerText =
            `Power: ${getTotalBladePower()}`;

        draw();

        animationId = requestAnimationFrame(update);
    }

    // =========================
    // SHADOW
    // =========================

    function drawShadow(x, y, radius, opacity = 0.25) {

        const gradient = ctx.createRadialGradient(
            x,
            y,
            radius * 0.2,
            x,
            y,
            radius
        );

        gradient.addColorStop(
            0,
            `rgba(0,0,0,${opacity})`
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            radius,
            radius * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = gradient;

        ctx.fill();
    }
    
    // =========================
    // DRAW PLAYER
    // =========================

    function drawPlayerCharacter() {

        // Player shadow
        drawShadow(
            player.x,
            player.y + 45,
            35,
            0.35
        );

        const bodyBob =
            Math.sin(Date.now() * 0.01) * 2;

        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        // Body
        ctx.beginPath();

        ctx.moveTo(player.x, player.y + 20 + bodyBob);
        ctx.lineTo(player.x, player.y + 55 + bodyBob);

        ctx.stroke();

        // Head
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
    }

    // =========================
    // DRAW
    // =========================

    function draw() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.save();

        let zoom =
            1 - (getTotalBladePower() * 0.003);

        zoom = Math.max(0.35, zoom);

        ctx.translate(
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.scale(zoom, zoom);

        ctx.translate(-player.x, -player.y);

        // Background field
        const grassPattern = ctx.createPattern(grassBg, "repeat");
        ctx.fillStyle = grassPattern;
        ctx.fillRect(1024, 1024, worldSize, worldSize);

        // Bubbles
        bubbles.forEach((b) => {
            drawShadow(
                b.x,
                b.y + 10,
                b.radius,
                0.15
            );

            ctx.beginPath();

            ctx.arc(
                b.x,
                b.y,
                b.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = "rgba(0,255,200,0.3)";
            ctx.fill();

            ctx.strokeStyle = "#00ffcc";
            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.fillText(b.value, b.x - 3, b.y + 3);
        });

        // Obstacles
        obstacles.forEach((o) => {
            drawShadow(
                o.x,
                o.y + o.size * 0.35,
                o.size * 0.6,
                0.25
            );

            ctx.fillStyle =
                `hsl(${120 - o.level * 8}, 80%, 45%)`;

            ctx.fillRect(
                o.x - o.size / 2,
                o.y - o.size / 2,
                o.size,
                o.size
            );

            ctx.fillStyle = "white";

            ctx.font = "bold 20px Arial";

            ctx.textAlign = "center";

            ctx.fillText(
                o.value,
                o.x,
                o.y + 6
            );
        });

        // Bots
        bots.forEach((bot) => {
            // Bot shadow
            drawShadow(
                bot.x,
                bot.y + 40,
                35,
                0.35
            );

            const size = 70;

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                bot.x,
                bot.y,
                size / 2,
                0,
                Math.PI * 2
            );

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
            const orbitRadius =
                60 + bot.blades * 2;

            const botSword =
                getSwordLevel(bot.blades);

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

                drawShadow(
                    bx,
                    by + 10,
                    botSword.size * 1.2,
                    0.2
                );

                drawCrescent(
                    bx,
                    by,
                    bladeAngle + Math.PI / 2,
                    botSword
                );
            }
        });

        // Lightning
        lightningEffects.forEach((l) => {

            ctx.strokeStyle = l.color;

            ctx.lineWidth = 3;

            ctx.shadowBlur = 8;
            ctx.shadowColor = l.color;

            ctx.beginPath();

            ctx.moveTo(l.x1, l.y1);

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

        drawPlayerCharacter();

        // =========================
        // PLAYER BLADES
        // SINGLE RING
        // =========================

        let allBlades = [];

        // Gather all blades from inventory
        for (let level = 1; level <= 9; level++) {

            const amount =
                player.inventory[level] || 0;

            const sword =
                swordLevels[level - 1];

            for (let i = 0; i < amount; i++) {

                allBlades.push(sword);
            }
        }

        // One shared orbit
        const orbitRadius =
            120 + allBlades.length * 2;

        // Draw all blades evenly
        for (let i = 0; i < allBlades.length; i++) {

            const sword =
                allBlades[i];

            const bladeAngle =
                player.angle +
                (i * Math.PI * 2 / allBlades.length);

            const bx =
                player.x +
                Math.cos(bladeAngle) * orbitRadius;

            const by =
                player.y +
                Math.sin(bladeAngle) * orbitRadius;

            drawShadow(
                bx,
                by + 10,
                sword.size * 1.2,
                0.2
            );

            drawCrescent(
                bx,
                by,
                bladeAngle + Math.PI / 2,
                sword
            );

            // Trail effect
            if (Math.random() < 0.15) {

                createTrail(
                    bx,
                    by,
                    sword.color
                );
            }
        }

        ctx.restore();
    }

    // =========================
    // GAME OVER SCREEN
    // =========================

    function gameOver() {

        gameRunning = false;

        cancelAnimationFrame(animationId);

        // Dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Text
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        ctx.font = "bold 60px Arial";
        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 - 80
        );

        // Retry button
        const btn = document.createElement("button");

        btn.innerText = "Retry";

        btn.style.position = "absolute";
        btn.style.left = "50%";
        btn.style.top = "50%";

        btn.style.transform =
            "translate(-50%, -50%)";

        btn.style.padding =
            "20px 40px";

        btn.style.fontSize =
            "28px";

        btn.style.cursor =
            "pointer";

        btn.style.border =
            "none";

        btn.style.borderRadius =
            "12px";

        btn.style.background =
            "#00ffcc";

        btn.style.color =
            "black";

        btn.style.fontWeight =
            "bold";

        document.body.appendChild(btn);

        btn.onclick = () => {

            btn.remove();

            startGame();
        };
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
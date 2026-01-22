const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

const TILE = 40;

// Player
const player = { x: 3, y: 7, color: "green" };

// Scenes
let scene = "office";

// Game items
let hasKey = false;

// Mini-game
let miniGameActive = false;
let score = 0;
let lives = 3;
let highScore = localStorage.getItem("highScore") || 0;
let swimmers = [];

// Map layout (1 = wall, 0 = floor)
const officeMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const poolMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function drawMap(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === 1) {
        ctx.fillStyle = "#000";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else {
        ctx.fillStyle = "#d9f2ff";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * TILE, player.y * TILE, TILE, TILE);
}

function drawOfficeObjects() {
  // Front desk
  ctx.fillStyle = "#b3b3b3";
  ctx.fillRect(3 * TILE, 3 * TILE, 4 * TILE, 1 * TILE);
  ctx.fillStyle = "#000";
  ctx.fillText("Front Desk", 3 * TILE + 10, 3 * TILE + 25);

  // Guard Office
  ctx.fillStyle = "#999";
  ctx.fillRect(1 * TILE, 2 * TILE, 4 * TILE, 3 * TILE);
  ctx.fillStyle = "#000";
  ctx.fillText("Guard Office", 1 * TILE + 10, 2 * TILE + 25);

  // Key
  if (!hasKey) {
    ctx.fillStyle = "gold";
    ctx.fillRect(2 * TILE, 3 * TILE, TILE / 2, TILE / 2);
  }
}

function drawPoolObjects() {
  // Pool (blocked water)
  ctx.fillStyle = "#8fd0ff";
  ctx.fillRect(3 * TILE, 2 * TILE, 12 * TILE, 5 * TILE);

  // Hot tub
  ctx.fillStyle = "#b3b3b3";
  ctx.fillRect(1 * TILE, 1 * TILE, 3 * TILE, 2 * TILE);
  ctx.fillStyle = "#000";
  ctx.fillText("Hot Tub", 1 * TILE + 10, 1 * TILE + 25);

  // Steam room
  ctx.fillStyle = "#b3b3b3";
  ctx.fillRect(1 * TILE, 3 * TILE, 3 * TILE, 2 * TILE);
  ctx.fillStyle = "#000";
  ctx.fillText("Steam", 1 * TILE + 10, 3 * TILE + 25);

  // Dive tank
  ctx.fillStyle = "#b3b3b3";
  ctx.fillRect(16 * TILE, 2 * TILE, 3 * TILE, 2 * TILE);
  ctx.fillStyle = "#000";
  ctx.fillText("Dive", 16 * TILE + 10, 2 * TILE + 25);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (scene === "office") {
    drawMap(officeMap);
    drawOfficeObjects();
  } else {
    drawMap(poolMap);
    drawPoolObjects();
  }

  drawPlayer();
  requestAnimationFrame(update);
}

update();

// Movement
document.addEventListener("keydown", (e) => {
  if (miniGameActive) return;

  let newX = player.x;
  let newY = player.y;

  if (e.key === "ArrowUp") newY--;
  if (e.key === "ArrowDown") newY++;
  if (e.key === "ArrowLeft") newX--;
  if (e.key === "ArrowRight") newX++;

  const map = scene === "office" ? officeMap : poolMap;
  if (map[newY] && map[newY][newX] === 0) {
    player.x = newX;
    player.y = newY;
  }
});

// Interact button
document.getElementById("interactBtn").addEventListener("click", () => {
  if (miniGameActive) return;

  if (scene === "office") {
    // Pick up key
    if (player.x === 2 && player.y === 3 && !hasKey) {
      hasKey = true;
      document.getElementById("objective").innerText = "Objective: Go to the pool door and enter.";
      alert("Key collected!");
    }

    // Door to pool (right side)
    if (player.x === 18 && player.y === 7 && hasKey) {
      scene = "pool";
      player.x = 2;
      player.y = 7;
    }
  } else {
    // Start mini-game (near pool deck)
    if (player.x === 5 && player.y === 7) {
      startMiniGame();
    }
  }
});

function startMiniGame() {
  miniGameActive = true;
  score = 0;
  lives = 3;
  swimmers = [];

  // spawn swimmers every 1 second
  setInterval(() => {
    if (!miniGameActive) return;
    swimmers.push({
      x: Math.floor(Math.random() * 14) + 3,
      y: Math.floor(Math.random() * 4) + 2,
      alive: true,
    });
  }, 1000);

  gameLoop();
}

function gameLoop() {
  if (!miniGameActive) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap(poolMap);
  drawPoolObjects();

  swimmers.forEach((s) => {
    if (s.alive) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(s.x * TILE + TILE / 2, s.y * TILE + TILE / 2, TILE / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = "#000";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, 10, 40);
  ctx.fillText(`High Score: ${highScore}`, 10, 60);

  if (lives <= 0) {
    miniGameActive = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      alert("New High Score!");
    }
    return;
  }

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (e) => {
  if (!miniGameActive) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  swimmers.forEach((s) => {
    if (s.alive) {
      const dx = mouseX - (s.x * TILE + TILE / 2);
      const dy = mouseY - (s.y * TILE + TILE / 2);
      if (Math.sqrt(dx * dx + dy * dy) < TILE / 2) {
        s.alive = false;
        score += 10;
      }
    }
  });
});

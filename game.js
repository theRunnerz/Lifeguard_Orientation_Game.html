const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE = 40;

// --- GAME STATE ---
let currentArea = "lobby";
let hasKey = false;

// --- PLAYER ---
const player = {
  x: 4,
  y: 8,
  size: 30
};

// --- MAPS ---
const maps = {
  lobby: {
    name: "Lobby / Office",
    color: "#f2b3c6", // pink
    width: 9,
    height: 12,
    transitions: [{ x: 4, y: 0, to: "pool", spawnX: 4, spawnY: 10 }],
    objects: [
      { x: 2, y: 5, type: "office" },
      { x: 6, y: 5, type: "desk" }
    ]
  },

  pool: {
    name: "Pool Deck",
    color: "#8fb7ff", // blue
    width: 9,
    height: 12,
    transitions: [{ x: 4, y: 11, to: "lobby", spawnX: 4, spawnY: 1 }],
    objects: [
      { x: 4, y: 4, type: "pool" },
      { x: 1, y: 2, type: "hotTub", locked: true },
      { x: 7, y: 2, type: "steam", locked: true },
      { x: 7, y: 7, type: "dive", locked: true }
    ]
  }
};

// --- INPUT ---
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
  if (e.key.toLowerCase() === "e") interact();
});

document.getElementById("interactBtn").onclick = interact;

// --- MOVE ---
function move(dx, dy) {
  player.x += dx;
  player.y += dy;

  const map = maps[currentArea];

  // bounds
  player.x = Math.max(0, Math.min(map.width - 1, player.x));
  player.y = Math.max(0, Math.min(map.height - 1, player.y));

  checkTransition();
}

// --- AREA TRANSITION (Pokémon style) ---
function checkTransition() {
  const map = maps[currentArea];

  map.transitions.forEach(t => {
    if (player.x === t.x && player.y === t.y) {
      currentArea = t.to;
      player.x = t.spawnX;
      player.y = t.spawnY;
    }
  });
}

// --- INTERACTION ---
function interact() {
  const map = maps[currentArea];

  map.objects.forEach(o => {
    if (o.x === player.x && o.y === player.y) {

      if (o.type === "office" && !hasKey) {
        hasKey = true;
        alert("🔑 You picked up the facility key!");
        document.getElementById("objective").innerText =
          "Objective: Explore the Pool Area.";
      }

      if (o.locked && !hasKey) {
        alert("🔒 This area is locked. Get the key first.");
      }

      if (o.locked && hasKey) {
        alert("✅ Area unlocked!");
        o.locked = false;
      }
    }
  });
}

// --- DRAW ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = maps[currentArea];

  // background
  ctx.fillStyle = map.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // objects
  map.objects.forEach(o => {
    ctx.fillStyle = o.locked ? "#555" : "#228B22";
    ctx.fillRect(o.x * TILE + 5, o.y * TILE + 5, 30, 30);
  });

  // player
  ctx.fillStyle = "red";
  ctx.fillRect(
    player.x * TILE + 5,
    player.y * TILE + 5,
    player.size,
    player.size
  );

  requestAnimationFrame(draw);
}

draw();

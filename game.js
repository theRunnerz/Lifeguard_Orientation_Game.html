const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const interactBtn = document.getElementById("interactBtn");
const objectiveText = document.getElementById("objective");

/* ---------------- PLAYER ---------------- */
const player = {
  x: 450,
  y: 420,
  size: 16,
  targetX: 450,
  targetY: 420,
  speed: 2.5,
  hasKey: false
};

/* ---------------- MAP ZONES ---------------- */
const zones = [
  {
    name: "Front Desk",
    x: 350,
    y: 330,
    w: 200,
    h: 80,
    interact: () => {
      if (!player.hasKey) {
        player.hasKey = true;
        alert(
          "🗝️ Key Collected\n\n" +
          "🧪 Water Test Completed:\n" +
          "• Chlorine: OK\n• pH: OK\n• Alkalinity: OK"
        );
        objectiveText.textContent = "Objective: Access the pool deck.";
      }
    }
  },

  {
    name: "6-Lane Pool\nShallow → Deep",
    x: 200,
    y: 150,
    w: 500,
    h: 140,
    locked: true
  },

  {
    name: "Hot Tub",
    x: 220,
    y: 80,
    w: 120,
    h: 50,
    locked: true
  },

  {
    name: "Steam Room",
    x: 380,
    y: 80,
    w: 120,
    h: 50,
    locked: true
  },

  {
    name: "Dive Tank",
    x: 730,
    y: 150,
    w: 120,
    h: 120,
    locked: true
  }
];

/* ---------------- INPUT: CLICK / TAP ---------------- */
canvas.addEventListener("click", movePlayer);
canvas.addEventListener("touchstart", e => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  player.targetX = touch.clientX - rect.left;
  player.targetY = touch.clientY - rect.top;
});

/* ---------------- MOVE ---------------- */
function movePlayer(e) {
  const rect = canvas.getBoundingClientRect();
  player.targetX = e.clientX - rect.left;
  player.targetY = e.clientY - rect.top;
}

function updatePlayer() {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }
}

/* ---------------- DRAW ---------------- */
function drawZone(z) {
  if (z.locked && !player.hasKey) {
    ctx.fillStyle = "#ccc";
  } else {
    ctx.fillStyle = "#cfe8ff";
  }

  ctx.fillRect(z.x, z.y, z.w, z.h);
  ctx.strokeRect(z.x, z.y, z.w, z.h);

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.fillText(z.name, z.x + 6, z.y + 16);
}

function drawPlayer() {
  ctx.fillStyle = player.hasKey ? "#2ecc71" : "#e74c3c";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

function drawEntrance() {
  ctx.fillStyle = "#999";
  ctx.fillRect(350, 450, 200, 30);
  ctx.fillStyle = "#000";
  ctx.fillText("ENTRANCE", 410, 470);
}

/* ---------------- INTERACT ---------------- */
interactBtn.addEventListener("click", () => {
  for (const z of zones) {
    if (
      player.x > z.x &&
      player.x < z.x + z.w &&
      player.y > z.y &&
      player.y < z.y + z.h
    ) {
      if (z.locked && !player.hasKey) {
        alert("🔒 Access denied. Get the key at the Front Desk.");
        return;
      }
      if (z.interact) z.interact();
      return;
    }
  }
  alert("Nothing to interact with here.");
});

/* ---------------- GAME LOOP ---------------- */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawEntrance();
  zones.forEach(drawZone);
  updatePlayer();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

gameLoop();

const GAME_VERSION = "1.1.2";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const player = {
  x: 120,
  y: 150,
  size: 20,
  speed: 2,
  targetX: 120,
  targetY: 150,
};

function drawVersion() {
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.fillText("v" + GAME_VERSION, canvas.width - 45, canvas.height - 10);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#ffd4d4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Guard Office
  ctx.fillStyle = "#a8d8ff";
  ctx.fillRect(40, 100, 150, 150);

  // Player
  ctx.fillStyle = "#0fa000";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Version
  drawVersion();
}

function update() {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function setTarget(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  player.targetX = clientX - rect.left;
  player.targetY = clientY - rect.top;
}

canvas.addEventListener("click", (e) => {
  setTarget(e.clientX, e.clientY);
});

canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    setTarget(touch.clientX, touch.clientY);
  },
  { passive: false }
);

gameLoop();

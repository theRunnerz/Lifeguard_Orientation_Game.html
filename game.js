const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Player
let player = { x: 50, y: 50, size: 20, speed: 4 };

// Game state
let running = false;

// Draw player
function drawPlayer() {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
  if (!running) return;
  clearCanvas();
  drawPlayer();
  requestAnimationFrame(gameLoop);
}

// Movement controls (keyboard)
document.addEventListener("keydown", (e) => {
  if (!running) return;
  switch (e.key) {
    case "ArrowUp":
    case "w":
      player.y -= player.speed;
      break;
    case "ArrowDown":
    case "s":
      player.y += player.speed;
      break;
    case "ArrowLeft":
    case "a":
      player.x -= player.speed;
      break;
    case "ArrowRight":
    case "d":
      player.x += player.speed;
      break;
  }
});

// Touch controls (mobile)
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchmove", (e) => {
  if (!running) return;
  e.preventDefault();
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    player.x += dx > 0 ? player.speed : -player.speed;
  } else {
    player.y += dy > 0 ? player.speed : -player.speed;
  }

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

// Buttons
document.getElementById("startBtn").addEventListener("click", () => {
  running = true;
  document.getElementById("status").textContent = "Game running!";
  requestAnimationFrame(gameLoop);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  running = false;
  player.x = 50;
  player.y = 50;
  document.getElementById("status").textContent = "Game reset. Tap start!";
  clearCanvas();
  drawPlayer();
});

// Initial draw
drawPlayer();

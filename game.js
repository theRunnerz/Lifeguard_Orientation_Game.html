const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ✅ Load background map
const mapImg = new Image();
mapImg.src = "renfrew_pool_map.png"; // <-- put the map image in your repo!

// Player
let player = { x: 100, y: 100, size: 15, speed: 4 };

// Game state
let running = false;

// Resize canvas properly
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Draw background + player
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw map
  if (mapImg.complete) {
    ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#aee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw player
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

// Game loop
function gameLoop() {
  if (!running) return;
  draw();
  requestAnimationFrame(gameLoop);
}

// Keyboard movement
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

// Touch movement
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
  player.x = 100;
  player.y = 100;
  document.getElementById("status").textContent = "Game reset. Tap start!";
  draw();
});

// Initial draw
draw();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 40;

// Player
const player = {
  x: 5,
  y: 7,
  size: 30,
  hasKey: false
};

// Map objects
const objects = [
  { name: "Guard Office", x: 1, y: 5, w: 3, h: 3, color: "#cfd8dc", interact: "key" },
  { name: "6 Lane Pool", x: 5, y: 4, w: 6, h: 4, color: "#4fc3f7" },
  { name: "Shallow End", x: 5, y: 7, w: 6, h: 1, color: "#81d4fa" },
  { name: "Deep End", x: 5, y: 4, w: 6, h: 1, color: "#0288d1" },
  { name: "Hot Tub", x: 5, y: 2, w: 2, h: 1, color: "#ffcc80" },
  { name: "Steam Room", x: 7, y: 2, w: 2, h: 1, color: "#bcaaa4" },
  { name: "Dive Tank", x: 12, y: 5, w: 2, h: 2, color: "#1565c0" },
  { name: "Front Desk", x: 1, y: 2, w: 3, h: 2, color: "#aed581" }
];

// Resize for mobile / iPad
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  for (let x = 0; x < canvas.width; x += TILE) {
    for (let y = 0; y < canvas.height; y += TILE) {
      ctx.strokeRect(x, y, TILE, TILE);
    }
  }

  // Draw objects
  objects.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE);
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(o.name, o.x * TILE + 4, o.y * TILE + 14);
  });

  // Draw player
  ctx.fillStyle = player.hasKey ? "#ffd600" : "#e53935";
  ctx.fillRect(
    player.x * TILE + 5,
    player.y * TILE + 5,
    player.size,
    player.size
  );
}

draw();

// Movement (touch + keyboard)
function move(dx, dy) {
  player.x += dx;
  player.y += dy;
  draw();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
});

// Simple tap movement (mobile)
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  player.x = x;
  player.y = y;
  draw();
});

// Interaction
document.getElementById("interactBtn").addEventListener("click", () => {
  const obj = objects.find(o =>
    player.x >= o.x &&
    player.x < o.x + o.w &&
    player.y >= o.y &&
    player.y < o.y + o.h
  );

  if (!obj) {
    alert("Nothing to interact with.");
    return;
  }

  if (obj.interact === "key" && !player.hasKey) {
    player.hasKey = true;
    document.getElementById("objective").innerText =
      "Objective complete! Explore the facility.";
    alert("You picked up the guard office key 🔑");
    draw();
    return;
  }

  alert(`You are at: ${obj.name}`);
});

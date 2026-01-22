const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 40;

// Player
const player = { x: 4, y: 6, hasKey: false };

// Map areas
const areas = [
  { name: "Guard Office", x: 1, y: 5, w: 3, h: 3, color: "#cfd8dc", key: true },
  { name: "6-Lane Pool", x: 5, y: 4, w: 6, h: 4, color: "#4fc3f7" },
  { name: "Shallow End", x: 5, y: 7, w: 6, h: 1, color: "#81d4fa" },
  { name: "Deep End", x: 5, y: 4, w: 6, h: 1, color: "#0288d1" },
  { name: "Hot Tub", x: 5, y: 2, w: 2, h: 1, color: "#ffcc80" },
  { name: "Steam Room", x: 7, y: 2, w: 2, h: 1, color: "#bcaaa4" },
  { name: "Dive Tank", x: 12, y: 5, w: 2, h: 2, color: "#1565c0" }
];

function draw() {
  // HARD RESET BACKGROUND (this is the fix)
  ctx.fillStyle = "#f7c6d0"; // Pokémon-style pink
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw areas
  areas.forEach(a => {
    ctx.fillStyle = a.color;
    ctx.fillRect(a.x * TILE, a.y * TILE, a.w * TILE, a.h * TILE);
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(a.name, a.x * TILE + 4, a.y * TILE + 14);
  });

  // Player
  ctx.fillStyle = player.hasKey ? "gold" : "red";
  ctx.fillRect(
    player.x * TILE + 8,
    player.y * TILE + 8,
    24,
    24
  );
}

draw();

// Keyboard movement
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") player.y--;
  if (e.key === "ArrowDown") player.y++;
  if (e.key === "ArrowLeft") player.x--;
  if (e.key === "ArrowRight") player.x++;
  draw();
});

// Tap to move (iPad friendly)
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  player.x = Math.floor((e.clientX - rect.left) / TILE);
  player.y = Math.floor((e.clientY - rect.top) / TILE);
  draw();
});

// Interact
document.getElementById("interactBtn").onclick = () => {
  const area = areas.find(a =>
    player.x >= a.x &&
    player.x < a.x + a.w &&
    player.y >= a.y &&
    player.y < a.y + a.h
  );

  if (!area) {
    alert("Nothing here.");
    return;
  }

  if (area.key && !player.hasKey) {
    player.hasKey = true;
    document.getElementById("objective").innerText =
      "Objective complete! Explore the pool.";
    alert("Key collected 🔑");
    draw();
    return;
  }

  alert(`You are at the ${area.name}`);
};

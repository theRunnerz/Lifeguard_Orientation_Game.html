// Simple orientation game logic

const instructions = document.getElementById("instructions");
const zones = document.querySelectorAll(".zone");
const resetBtn = document.getElementById("reset-btn");

zones.forEach(zone => {
  zone.addEventListener("click", () => {
    const name = zone.getAttribute("data-zone");
    instructions.textContent = `You tapped on the ${name}!`;
  });
});

resetBtn.addEventListener("click", () => {
  instructions.textContent = "Tap a zone to begin!";
});

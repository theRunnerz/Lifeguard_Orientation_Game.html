const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// IMPORTANT: set real pixel size
canvas.width = 320;
canvas.height = 480;

// test render
ctx.fillStyle = "#f2b3c6";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "black";
ctx.font = "16px Arial";
ctx.fillText("MAP LOADED", 90, 240);

console.log("Game loaded");

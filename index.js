//#region utils
function GetRandomColor() {
  return `hsl(${Math.random() * 360 + 0}, 50%, 50%)`;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
//#endregion

//#region constants
const width = 360;
const height = 650;
const accentColor = "#3a9cc0"

const playerSpeed = 10;
const playerRadius = 15;

const obstacleWidth = Math.ceil(width / 3);
const obstacleSpeed = 1;
const obstacleSpacing = 200;
const obstacleStartingPoint = -100
const obstacleLerpSpeed = 0.2;
const obstacleStart = { x: 0, y: -200 };

const strokeWidth = playerRadius / 2;
let pauseGame = false;
let isSupportGyro = false;
//#endregion
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = width;
canvas.height = height;
canvas.style.background = accentColor;

let currentGamma = 0;
let neutralGamma = 0;
const keys = {};
const handleOrientation = (event) => {
  console.log(event.gamma);
  neutralGamma = event.gamma;
};

async function enableMotion() {
  if (typeof DeviceOrientationEvent === "undefined") {
    alert("Device orientation not supported");
    return false;
  }

  // Some browsers (notably iOS Safari) require permission
  if (
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        alert("Motion permission denied");
        return false;
      } else {
        // IMPORTANT: listener goes here
        window.addEventListener(
          "deviceorientation",
          handleOrientation
        );
        isSupportGyro = true;
        console.log("Motion enabled");
      }
    } catch (error) {
      alert("Motion permission error:", error);
      return false;
    }
  }
}


window.onload = async () => {
  enableMotion();
}
// 3. Listen for keyboard events
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  OnKeyDown(e.key);
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

class Player {
  constructor(ctx) {
    this.position = {
      x: (width / 2) - playerRadius,
      y: 580
    };
    this.lerpPosition = { ...this.position };
    this.ctx = ctx;
    this.playerRightClamp = width - playerRadius;
  }
  move(delta) {
    if (!isSupportGyro) {
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) this.position.x -= playerSpeed;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) this.position.x += playerSpeed;
      const time = 1 - Math.exp(-1 * delta);
      this.lerpPosition.x = lerp(this.lerpPosition.x, this.position.x, time);
    } else {
      const tilt = currentGamma - neutralGamma;
      this.lerpPosition.x += tilt;
      // const time = 1 - Math.exp(-1 * delta);
      // this.lerpPosition.x = lerp(this.lerpPosition.x, this.position.x, time);
    }
    if (playerRadius > this.position.x) {
      this.position.x = playerRadius;
    } if (this.playerRightClamp < this.position.x) {
      this.position.x = this.playerRightClamp;
    }
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeStyle = "white";
    this.ctx.arc(this.lerpPosition.x, this.lerpPosition.y, playerRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
}
canvas.addEventListener("click",enableMotion);

// |      |      |      |       0
// |      |      |------|       1
// |      |------|      |       2
// |------|      |      |       3
// |------|------|      |       4
// |------|      |------|       5
// |      |------|------|       6

class Obstacle {
  constructor(ctx, y) {
    this.position = {
      x: 0,
      y: y
    }
    this.ctx = ctx;
    this.id = Math.floor(Math.random() * 6) + 1;
    console.log("id - ", this.id)
  }

  move() {
    this.position.y += obstacleSpeed;
  }
  draw() {
    if ([3, 4, 5].includes(this.id)) {
      // first
      this.ctx.beginPath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = "white";
      this.ctx.rect(this.position.x, this.position.y, obstacleWidth, playerRadius * 2);
      this.ctx.stroke();
    }
    if ([2, 4, 6].includes(this.id)) {
      // second
      this.ctx.beginPath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = "white";
      this.ctx.rect(obstacleWidth, this.position.y, obstacleWidth, playerRadius * 2);
      this.ctx.stroke();
    }
    if ([1, 5, 6].includes(this.id)) {
      // third
      this.ctx.beginPath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = "white";
      this.ctx.rect(obstacleWidth * 2, this.position.y, obstacleWidth, playerRadius * 2);
      this.ctx.stroke();
    }
  }
}

let lastTime = 0;
const fps = 20;
const interval = 1000 / fps;
const player = new Player(ctx);
// const obs = new Obstacles(ctx);

function ResetCanvas() {
  ctx.clearRect(0, 0, width, height);
}
function UpdatePlayer(delta) {
  player.move(delta);
  player.draw();
}
let OBSTACLES = [];
function addObstacles() {
  OBSTACLES.push(new Obstacle(ctx, obstacleStartingPoint))
}
function UpdateObstacles() {
  OBSTACLES.forEach(obstacle => {
    obstacle.move();
    obstacle.draw();
  });
  OBSTACLES = OBSTACLES.filter(obstacle => obstacle.position.y < height + playerRadius + playerRadius);
  const [lastObstacle] = OBSTACLES.slice(-1);
  if (lastObstacle.position.y > obstacleSpacing) {
    addObstacles();
  }
}
function OnKeyDown(key) {
  if (key == "Escape") pauseGame = !pauseGame;
}

function animate(timestamp) {
  const delta = timestamp - lastTime;
  if (!pauseGame && (delta > interval)) {
    lastTime = timestamp - (delta % interval);
    ResetCanvas();
    UpdatePlayer(delta);
    UpdateObstacles();
  }
  requestAnimationFrame(animate);
}

let physicsLastTime = 0;
const physicsInterval = 1000 / 1;
function physics(timestamp) {
  const delta = timestamp - physicsLastTime;
  if (!pauseGame && (delta > physicsInterval)) {
    physicsLastTime = timestamp - (delta % physicsInterval);
    // console.log("Keys")
  }
  requestAnimationFrame(physics);
}

addObstacles();

animate();
physics();

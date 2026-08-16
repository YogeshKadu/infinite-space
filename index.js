//#region utils
function GetRandomColor() {
  return `hsl(${Math.random() * 360 + 0}, 50%, 50%)`;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function StartGame() {
  pauseGame = false;
  isGameOver = false;
  obstacleSpeed = obstacleInitialSpeed;
  playerSpeed = playerInitialSpeed;
  startMenu.style.display = "none";
  gameMenu.style.display = "none";
  resumeBTN.style.display = "block";
  player = new Player(ctx);
  OBSTACLES = [];
  addObstacles();
  animate();
  physics();
  CatchInterval = setInterval(() => {
    playerSpeed += 0.5;
    obstacleSpeed += 0.5;
  }, speedUpTime)
}
function ResusmeGame() {
  pauseGame = false;
  gameMenu.style.display = "none";
  obstacleSpeed = obstacleInitialSpeed;
  playerSpeed = playerInitialSpeed;
  CatchInterval = setInterval(() => {
    playerSpeed += 0.5;
    obstacleSpeed += 0.5;
  }, speedUpTime)
}
function PauseGame() {
  pauseGame = true;
  if(isGameOver)
    resumeBTN.style.display = "none";
  gameMenu.style.display = "flex";
  gameMenu.style.display = "flex";
  clearInterval(CatchInterval);
}
function Quit() {}
function ToggleMenu() {
  if(pauseGame) {
    ResusmeGame();
  } else {
    PauseGame();
  }
}
//#endregion

//#region constants
const width = 360;
const height = 650;
const accentColor = "#3a9cc0"

let player;
const playerInitialSpeed = 10;
let playerSpeed = playerInitialSpeed;
const playerRadius = 15;
const playerSize = playerRadius * 2;

const obstacleWidth = Math.ceil(width / 3);
const obstacleInitialSpeed = 3;
let obstacleSpeed = obstacleInitialSpeed;
const obstacleSpacing = 200;
const obstacleStartingPoint = -1 * (playerSize + 20)
const obstacleStart = { x: 0, y: 0 };
const speedUpTime = 3000;

const strokeWidth = playerRadius / 2;
let pauseGame = true;
let isGameOver = false;
//#endregion
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const UI = document.getElementById("ui");
const startMenu = document.getElementById("start_menu");
const gameMenu = document.getElementById("game_menu");
const resumeBTN = document.getElementById("resumeBTN");

let CatchInterval;

canvas.width = width;
canvas.height = height;
canvas.style.background = accentColor;

UI.style.width = `${width}px`
UI.style.height = `${height}px`

const keys = {};

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
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) this.position.x -= playerSpeed;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) this.position.x += playerSpeed;
    this.lerpPosition.x = lerp(this.lerpPosition.x, this.position.x, 0.5);
    if (playerRadius > this.lerpPosition.x) {
      this.lerpPosition.x = playerRadius;
      this.position.x = playerRadius;
    } if (this.playerRightClamp < this.lerpPosition.x) {
      this.lerpPosition.x = this.playerRightClamp;
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
  #checkCollusion(obstacle) {
    return (
      this.position.x <= (obstacle.position.x + obstacleWidth) &&
      (this.position.x + playerSize) >= obstacle.position.x &&
      this.position.y <= (obstacle.position.y + playerSize) &&
      (this.position.y + playerSize) > obstacle.position.y
    )
  }
  #handleCollusion(obstacle) {
    const { id, position } = obstacle;
    if ([3, 4, 5].includes(id)) {
      const _obstacle = { position: { y: position.y, x: 0 } }
      if (this.#checkCollusion(_obstacle)) {
        console.log("[3, 4, 5]");
        return true;
      }
    }
    if ([2, 4, 6].includes(id)) {
      const _obstacle = { position: { y: position.y, x: obstacleWidth } }
      if (this.#checkCollusion(_obstacle)) {
        console.log("[2, 4, 6]");
        return true;
      }
    }
    if ([1, 5, 6].includes(id)) {
      const _obstacle = { position: { y: position.y, x: obstacleWidth * 2 } }
      if (this.#checkCollusion(_obstacle)) {
        console.log("[1, 5, 6]");
        return true;
      }
    }
    return false;
  }
  collusion() {
    // const latestObstacle = OBSTACLES.filter(obstacle => {if(obstacle.position.y < this.position.y)})
    let lastObstacle;
    for (let i = 0; i < OBSTACLES.length; i++) {
      const obstacle = OBSTACLES[i];
      if (obstacle.position.y < this.position.y) {
        lastObstacle = obstacle;
        break;
      }
    }
    if (this.#handleCollusion(lastObstacle)) {
      // pauseGame = true;
      isGameOver = true;
      PauseGame();
    }
  }
}


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
      this.ctx.rect(this.position.x, this.position.y, obstacleWidth, playerSize);
      this.ctx.stroke();
    }
    if ([2, 4, 6].includes(this.id)) {
      // second
      this.ctx.beginPath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = "white";
      this.ctx.rect(obstacleWidth, this.position.y, obstacleWidth, playerSize);
      this.ctx.stroke();
    }
    if ([1, 5, 6].includes(this.id)) {
      // third
      this.ctx.beginPath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = "white";
      this.ctx.rect(obstacleWidth * 2, this.position.y, obstacleWidth, playerSize);
      this.ctx.stroke();
    }
  }
}

let lastTime = 0;
const fps = 20;
const interval = 1000 / fps;

function ResetCanvas() {
  ctx.clearRect(0, 0, width, height);
}
function UpdatePlayer() {
  player.move();
  player.draw();
  player.collusion();
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
  if (key == "Escape") {
    pauseGame = !pauseGame;
    if (pauseGame) {
      PauseGame();
    } else {
      ResusmeGame();
    }
  };

}

function animate(timestamp) {
  const delta = timestamp - lastTime;
  if (!pauseGame && (delta > interval)) {
    lastTime = timestamp - (delta % interval);
    ResetCanvas();
    UpdatePlayer();
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

// addObstacles();

// animate();
// physics();

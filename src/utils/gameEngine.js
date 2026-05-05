export class GameEngine {
  constructor() {
    this.gameLoop = null;
    this.running = false;
  }

  start(callback, fps = 60) {
    if (this.running) return;
    this.running = true;
    this.gameLoop = setInterval(callback, 1000 / fps);
  }

  stop() {
    this.running = false;
    if (this.gameLoop) clearInterval(this.gameLoop);
  }
}

export const detectCollision = (obj1, obj2) => {
  return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
};
const ServerObject = require("./ServerObject");
const Vector2 = require("./vector2");

module.exports = class Bullet extends ServerObject {
  constructor() {
    super();
    this.direction = new Vector2();
    this.speed = 0.25;
    this.isDestroy = false;
    this.activator = "";
  }
  onUpdate() {
    this.position.x += this.direction.x * this.speed;
    this.position.y += this.direction.y * this.speed;

    return this.isDestroy;
  }
};

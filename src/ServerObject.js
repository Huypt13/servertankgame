const shortid = require("shortid");
const Vector2 = require("./vector2");

module.exports = class ServerObject {
  constructor() {
    this.id = shortid.generate();
    this.name = "ServerObject";
    this.position = new Vector2();
  }
};

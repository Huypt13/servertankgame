const shortid = require("shortid");
const Vector2 = require("../vector2");

module.exports = class ServerItem {
  constructor() {
    this.username = "ServerItem";
    this.id = shortid.generate();
    this.position = new Vector2();
  }
};

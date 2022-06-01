const Connection = require("../Connection");
const ServerItem = require("../utilities/ServerItem");
const Vector2 = require("../vector2");
const AIBase = require("../aiBoss/AIBase");
const TankAi = require("../aiBoss/TankAI");

class LobbyBase {
  constructor(id) {
    this.id = id;
    // <list>
    this.connections = [];
    this.serverItems = [];
  }
  onUpdate() {
    const lobby = this;
  }

  onEnterLobby(connection) {
    let lobby = this;
    let player = connection.player;
    console.log(
      "player : " + player.displayInfor() + " join lobby " + lobby.id
    );
    lobby.connections.push(connection);
    player.lobby = lobby.id;
    connection.lobby = lobby;
  }
  onLeaveLobby(connection) {
    let lobby = this;
    console.log(
      "player : " +
        connection.player.displayInfor() +
        " leave lobby " +
        lobby.id
    );
    connection.lobby = undefined;
    let index = lobby.connections.indexOf(connection);
    if (index > -1) {
      lobby.connections.splice(index, 1);
    }
  }

  // spawn serverItem
  onServerSpawn(item = ServerItem, location) {
    item.position = location;
    this.serverItems.push(item);
    this.connections.forEach((connection) => {
      connection.socket.emit("serverSpawn", {
        id: item.id,
        name: item.username,
        position: { x: item.position.x, y: item.position.y },
      });
    });
  }
  //
  onServerUnspawn(item = ServerItem) {
    const lobby = this;
    const connections = this.connections;

    // remove item from array and
    this.deleteServerItem(item);
    connections.forEach((connection) => {
      connection.socket.emit("serverUnspawn", { id: item.id });
    });
  }

  //
  deleteServerItem(item = ServerItem) {
    const lobby = this;
    let serverItems = lobby.serverItems;
    let index = serverItems.indexOf(item);
    if (index > -1) {
      serverItems.splice(index, 1);
    }
  }
}

module.exports = LobbyBase;

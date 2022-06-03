const Player = require("./Player");
const Connection = require("./Connection");
const LobbyBase = require("./lobbies/LobbyBase");
const GameLobby = require("./lobbies/GameLobby");
const GameLobbySetting = require("./lobbies/GameLobbySetting");

// servver handler

class ServerHandle {
  constructor() {
    this.connections = [];

    // <id : string, lobby: Lobby >
    this.lobbys = [];
    this.lobbys[0] = new LobbyBase();
  }

  // interval every 50 miliseconds
  onUpdate() {
    const serverHandle = this;
    // update each lobby
    for (let id in serverHandle.lobbys) {
      serverHandle.lobbys[id].onUpdate();
    }
  }

  // handle new connection
  onConnected(socket, { username, id }) {
    console.log("on connected server handle");
    let serverHandle = this;
    // dac trung cho 1 client
    let connection = new Connection();
    connection.socket = socket;
    connection.player = new Player({ username, id });
    connection.serverHandle = serverHandle;
    let player = connection.player;
    let lobbys = this.lobbys;

    console.log(`Add new player to server ${player.id}`);
    serverHandle.connections[player.id] = connection;
    socket.join(player.lobby);
    connection.lobby = lobbys[player.lobby]; //???
    connection.lobby.onEnterLobby(connection);

    return connection;
  }
  onDisconnected(connection) {
    let server = this;
    const { id, lobby } = connection.player;
    if (!id || !lobby) {
      return;
    }
    delete server.connections[id];
    console.log(`player ${connection.player.displayInfor()} disconnected  `);
    connection.socket.broadcast.to(lobby).emit("disconnected", {
      id: id,
    });

    // leave lobby

    // lobbyId
    let currentLobbyIndex = connection.player.lobby;

    server.lobbys[lobby].onLeaveLobby(connection);
    if (
      server.lobbys[currentLobbyIndex] != 0 &&
      server.lobbys[currentLobbyIndex].connections.length == 0
    ) {
      console.log("closing lobby", currentLobbyIndex);
      server.lobbys.splice(currentLobbyIndex, 1);
    }
  }
  onAttemptToJoinGame(connection) {
    // check join game chua
    //  neu chua make new game
    console.log("onAttemptToJoinGame serverhandle");
    let serverHandle = this;
    let gameLobbis = this.lobbys.filter((lb) => {
      return lb instanceof GameLobby;
    });
    console.log("game  lb length", gameLobbis.length);
    let lobbyFound = false;
    gameLobbis.forEach((lb) => {
      if (!lobbyFound) {
        const canJoin = lb.canEnterLobby(connection);
        if (canJoin) {
          lobbyFound = true;
          serverHandle.onSwitchLobby(connection, lb.id);
        }
      }
    });
    if (!lobbyFound) {
      let gameLobby = new GameLobby(
        gameLobbis.length + 1,
        new GameLobbySetting("FFA", 2)
      );
      serverHandle.lobbys.push(gameLobby);
      serverHandle.onSwitchLobby(connection, gameLobby.id);
      console.log("join game not found", connection.getInfor());
    }
    console.log("join game", connection.getInfor());
  }
  onSwitchLobby(connection, newLobbyId) {
    console.log(newLobbyId, connection.player.lobby);
    connection.socket.join(newLobbyId);
    connection.lobby = this.lobbys[newLobbyId];
    if (connection.player.lobby) {
      this.lobbys[connection.player.lobby].onLeaveLobby(connection);
    }
    this.lobbys[newLobbyId].onEnterLobby(connection);
  }
}
//
module.exports = ServerHandle;

/* 

*/

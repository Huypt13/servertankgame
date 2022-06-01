const LobbyBase = require("./LobbyBase");
const GameLobbySetting = require("./GameLobbySetting");
const Connection = require("../Connection");
const Bullet = require("../Bullet");
const LobbyState = require("../utilities/LobbyState");
const Vector2 = require("../vector2");
const ServerItem = require("../utilities/ServerItem");
const AIBase = require("../aiBoss/AIBase");
const TankAI = require("../aiBoss/TankAI");

// luu game play trong lobby
class GameLobby extends LobbyBase {
  constructor(id, settings = GameLobbySetting) {
    super(id);
    super.onUpdate();
    this.settings = settings;
    this.lobbyState = new LobbyState();
    this.bullets = [];
  }
  onUpdate() {
    let lobby = this;
    super.onUpdate();
    let serverItems = lobby.serverItems;
    let aiList = serverItems.filter((item) => {
      return item instanceof AIBase;
    });

    aiList.forEach((ai) => {
      ai.onObtainTarget(lobby.connections);
      // update vi tri va rotation
      ai.onUpdate(
        (data) => {
          lobby.connections.forEach((connection) => {
            let socket = connection.socket;

            socket.emit("updateAI", data);
          });
        },
        (data) => {
          lobby.onFireBullet(undefined, data, true);
        }
      );
    });
    this.updateBullets();
    this.updateDeadPlayers();
    this.updateAIDead();
  }
  canEnterLobby(connection) {
    let lobby = this;
    let maxPlayerCount = lobby.settings.maxPlayers;
    let currentPlayerCount = lobby.connections.length;
    if (currentPlayerCount + 1 > maxPlayerCount) {
      return false;
    }
    return true;
  }
  onEnterLobby(connection) {
    let lobby = this;
    super.onEnterLobby(connection);

    if (lobby.connections.length == lobby.settings.maxPlayers) {
      console.log("can start game. lobby:", lobby.id);
      lobby.lobbyState.currentState = lobby.lobbyState.GAME;
      // spawn all player
      lobby.onSpawnAllPlayersIntoGame();
      // spawn all ai
      lobby.onSpawnAIIntoGame();
    }

    //  lobby.addPlayer(connection);
    let returnData = {
      state: lobby.lobbyState.currentState,
    };
    connection.socket.emit("loadGame");
    connection.socket.emit("lobbyUpdate", returnData);
    console.log("update " + lobby.id, returnData);
    connection.socket.broadcast.to(lobby.id).emit("lobbyUpdate", returnData);
  }
  onSpawnAIIntoGame() {
    const lobby = this;
    lobby.onServerSpawn(new TankAI(), new Vector2(-6, 2));
    //lobby.onServerSpawn(new TankAI(), new Vector2(-5, 4));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-3, 5));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-4, 6));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-6, 0));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-5, -2));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-3, -4));
    // lobby.onServerSpawn(new TankAI(), new Vector2(-4, -6));
  }
  onUnSpawnAllAIIntoGame(connection = Connection) {
    let lobby = this;
    const serverItems = lobby.serverItems;
    //Remove all server items from the client, but still leave them in the server others
    serverItems.forEach((serverItem) => {
      connection.socket.emit("serverUnspawn", {
        id: serverItem.id,
      });
    });
  }
  onSpawnAllPlayersIntoGame() {
    const lobby = this;
    const connections = lobby.connections;
    connections.forEach((connection) => {
      lobby.addPlayer(connection);
    });
  }

  onLeaveLobby(connection) {
    let lobby = this;
    super.onLeaveLobby(connection);
    lobby.removePlayer(connection);

    // handle all server unspawn object
    lobby.onUnSpawnAllAIIntoGame(connection);
  }
  updateBullets() {
    let lobby = this;
    let bullets = lobby.bullets;
    let connections = lobby.connections;
    bullets.forEach((bullet) => {
      const isDestroy = bullet.onUpdate();
      if (isDestroy) {
        lobby.despawnBullet(bullet);
      } else {
        // let returnData = {
        //   id: bullet.id,
        //   position: { x: bullet.position.x, y: bullet.position.y },
        // };
        // connections.forEach((connection) => {
        //   connection.socket.emit("updatePos", returnData);
        // });
      }
    });
  }
  updateDeadPlayers() {
    let lobby = this;
    let connections = lobby.connections;
    connections.forEach((connection) => {
      let player = connection.player;
      if (player.isDead) {
        let isRespawn = player.respawnCounter();
        if (isRespawn) {
          let returnData = {
            id: player.id,
            position: {
              x: player.position.x,
              y: player.position.y,
            },
          };
          connection.socket.emit("playerRespawn", returnData);
          connection.socket.broadcast
            .to(lobby.id)
            .emit("playerRespawn", returnData);
        }
      }
    });
  }

  onFireBullet(connection, data, isAI = false) {
    const lobby = this;
    let bullet = new Bullet();
    bullet.name = "Bullet";
    bullet.activator = data.activator;
    bullet.position.x = data.position.x;
    bullet.position.y = data.position.y;
    bullet.direction.x = data.direction.x;
    bullet.direction.y = data.direction.y;
    this.bullets.push(bullet);
    const returnData = {
      name: bullet.name,
      activator: bullet.activator,
      id: bullet.id,
      position: {
        x: bullet.position.x,
        y: bullet.position.y,
      },
      direction: {
        x: bullet.direction.x,
        y: bullet.direction.y,
      },
      speed: bullet.speed,
    };
    if (!isAI) {
      connection.socket.emit("serverSpawn", returnData);
      connection.socket.broadcast.to(lobby.id).emit("serverSpawn", returnData);
    } else if (lobby.connections.length > 0) {
      this.connections[0].socket.broadcast
        .to(lobby.id)
        .emit("serverSpawn", returnData);
      this.connections[0].socket.emit("serverSpawn", returnData);
    }
  }

  onCollsionDestroy(connection, data) {
    console.log("gamelobby onCollsionDestroy");
    const lobby = this;
    const returnBullet = this.bullets.filter((e) => e.id == data.id);
    returnBullet.forEach((bullet) => {
      console.log("vi tri dan khi no", bullet);
      //new
      let enemyId = data.enemyId;
      console.log("xx", enemyId);
      let connection1 = lobby.connections.find((c) => {
        return c.player.id === enemyId;
      });

      const ai = lobby.serverItems.find((s) => {
        return s.id === enemyId;
      });

      const subjectOfAttack = connection1?.player ? connection1?.player : ai;
      if (!subjectOfAttack) return;
      let isDead = subjectOfAttack.dealDamage(20);
      if (isDead) {
        let returnData = {
          id: subjectOfAttack.id,
        };
        connection.socket.emit("playerDied", returnData);
        connection.socket.broadcast.to(lobby.id).emit("playerDied", returnData);
      } else {
        let returnData = {
          id: subjectOfAttack.id,
          health: subjectOfAttack.health,
        };
        connection.socket.emit("playerAttacked", returnData);
        connection.socket.broadcast
          .to(lobby.id)
          .emit("playerAttacked", returnData);
      }

      bullet.isDestroy = true;
    });
  }
  despawnBullet(bullet = Bullet) {
    let index = this.bullets.indexOf(bullet);
    if (index > -1) {
      this.bullets.splice(index, 1);
    }
    let returnData = { id: bullet.id };
    const lobby = this;
    lobby.connections.forEach((connection) => {
      connection.socket.emit("serverUnSpawn", returnData);
    });
  }
  addPlayer(connection) {
    const lobby = this;
    let connections = lobby.connections;
    let socket = connection.socket;
    const returnData = { id: connection.player.id };
    socket.emit("spawn", returnData);
    // socket.broadcast.to(lobby.id).emit("spawn", returnData);

    // tell myself about all people in room
    connections.forEach((c) => {
      if (connection.player.id != c.player.id) {
        socket.emit("spawn", { id: c.player.id });
      }
    });
  }
  removePlayer(connection) {
    let lobby = this;
    connection.socket.broadcast
      .to(lobby.id)
      .emit("disconnected", { id: connection.player.id });
  }
  updateAIDead() {
    const lobby = this;
    const connections = this.connections;
    let aiList = lobby.serverItems.filter((item) => {
      return item instanceof AIBase;
    });
    aiList.forEach((ai) => {
      if (ai.isDead) {
        let isRespawn = ai.respawnCounter();
        if (isRespawn) {
          let socket = connections[0].socket;
          let returnData = {
            id: ai.id,
            position: {
              x: ai.position.x,
              y: ai.position.y,
            },
          };

          socket.emit("playerRespawn", returnData);
          socket.broadcast.to(lobby.id).emit("playerRespawn", returnData);
        }
      }
    });
  }
}

module.exports = GameLobby;

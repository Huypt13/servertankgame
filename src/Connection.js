// dac trung cho 1 client connect to server
class Connection {
  constructor() {
    this.socket;
    this.player; // luu lobbyid
    this.serverHandle;
    this.lobby;
  }
  getInfor() {
    return `${this.player.id} ${this.lobby}`;
  }
  createEvents() {
    console.log("createEvents connection");
    let connection = this;
    let socket = connection.socket;
    let serverHandle = connection.serverHandle;
    let player = connection.player;

    socket.on("disconnect", () => {
      serverHandle.onDisconnected(connection);
    });
    socket.on("joinGame", () => {
      console.log("on join game create event", this.getInfor());

      serverHandle.onAttemptToJoinGame(connection);
    });
    socket.on("fireBullet", (data) => {
      connection.lobby.onFireBullet(connection, data, false);
    });
    socket.on("collisionDestroy", (data) => {
      console.log("connection collisiondestroy", this.getInfor());
      connection.lobby.onCollsionDestroy(connection, data);
    });
    socket.on("updatePos", (data) => {
      const { x, y } = data;
      player.position.x = x;
      player.position.y = y;
      socket.broadcast.to(connection.lobby.id).emit("updatePos", player);
    });
    socket.on("updateRotation", ({ tankRotation, barrelRotation }) => {
      player.tankRotation = tankRotation;
      player.barrelRotation = barrelRotation;
      socket.broadcast.to(connection.lobby.id).emit("updateRotation", player);
    });
  }
}

module.exports = Connection;

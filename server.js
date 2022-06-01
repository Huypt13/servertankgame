const express = require("express");
const path = require("path");
const shortid = require("shortid");

const Player = require("./src/player");
const Bullet = require("./src/Bullet");

const app = express();
const server = require("http").createServer(app);

server.listen(process.env.PORT || 8080, () => {
  console.log("thanh cong");
});

let players = [];
let sockets = [];
let bullets = [];

// updated
setInterval(
  () => {
    bullets.forEach((b) => {
      const isDestroy = b.onUpdate();
      if (isDestroy) {
        despawnBullet(b);
      } else {
        let returnData = {
          id: b.id,
          position: { x: b.position.x, y: b.position.y },
        };
        for (let playerid in players) {
          sockets[playerid].emit("updatePos", returnData);
        }
      }
    });
    // handle dead player
    for (let playerId in players) {
      let player = players[playerId];
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
          sockets[playerId].emit("playerRespawn", returnData);
          sockets[playerId].broadcast.emit("playerRespawn", returnData);
        }
      }
    }
  },
  50,
  0
);

function despawnBullet(b) {
  let index = bullets.indexOf(b);
  if (index > -1) {
    bullets.splice(index, 1);
  }
  let returnData = { id: b.id };
  for (let playerid in players) {
    sockets[playerid].emit("serverUnSpawn", returnData);
  }
}
//create socket io
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  console.log("aaa");
  console.log("connect", socket.id);
  const id = shortid.generate();

  // phat trien sau

  //   socket.on("joinRoom", (data) => {
  //     // const { room1, name } = json.parse(data);
  //     console.log("join room");
  //     const room1 = "a";
  //     const name = "huy";
  //     room.joinRoom(id, socket, room1);
  //     socket.join(room1);
  //     // gui nhan vat cho room
  //     socket.to(room1).emit("someOneJoin", { id });
  //     // khoi to my character
  //     socket.emit("spawnMyCharacter", { id });
  //     // khoi tao nhan vat ng choi khac trong room
  //     room.getRoom(room1).forEach((e) => {
  //       socket.emit("spawnCharacter", { id: e.id });
  //     });
  //     // tao nhan vat
  //   });

  sockets[id] = socket;
  players[id] = new Player(id);
  let myPlayer = players[id];
  socket.emit("register", { id });
  socket.emit("spawn", players[id]);
  socket.broadcast.emit("spawn", players[id]); // tell to other
  // send another to me
  for (let playerId in players) {
    if (playerId != id) {
      socket.emit("spawn", players[playerId]);
    }
  }

  socket.on("updatePos", (data) => {
    const { x, y } = data;
    myPlayer.position.x = x;
    myPlayer.position.y = y;
    // send vi tri to another
    socket.broadcast.emit("updatePos", myPlayer);
  });
  socket.on("updateRotation", ({ tankRotation, barrelRotation }) => {
    myPlayer.tankRotation = tankRotation;
    myPlayer.barrelRotation = barrelRotation;
    socket.broadcast.emit("updateRotation", myPlayer);
  });
  socket.on("fireBullet", (data) => {
    let bullet = new Bullet();
    bullet.name = "Bullet";
    bullet.activator = data.activator;
    bullet.position.x = data.position.x;
    bullet.position.y = data.position.y;
    bullet.direction.x = data.direction.x;
    bullet.direction.y = data.direction.y;
    bullets.push(bullet);
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
    };
    socket.emit("serverSpawn", returnData);
    socket.broadcast.emit("serverSpawn", returnData);
  });
  socket.on("collisionDestroy", (data) => {
    const returnBullet = bullets.filter((e) => e.id == data.id);
    returnBullet.forEach((rb) => {
      let playerHit = false;
      for (let playerId in players) {
        if (rb.activator != playerId) {
          playerHit = true;
          let player = players[playerId];
          let distance = rb.position.Distance(player.position);
          if (distance < 0.65) {
            let isDead = player.dealDamage(20);
            if (isDead) {
              let returnData = {
                id: player.id,
              };
              sockets[player.id].emit("playerDied", returnData);
              sockets[player.id].broadcast.emit("playerDied", returnData);
            } else {
              let returnData = {
                id: player.id,
                health: players[player.id].health,
              };
              sockets[player.id].emit("playerAttacked", returnData);
              sockets[player.id].broadcast.emit("playerAttacked", returnData);
            }
            despawnBullet(rb);
          }
        }
      }
      rb.isDestroy = true;
    });
  });
  socket.on("disconnect", () => {
    // console.log("disconnect");
    // room.leaveRoom(id);
    socket.broadcast.emit("disconnected", { id });
    delete sockets[id];
    delete players[id];
  });
});

function interval(func, wait, time) {
  let interv = (function (w, t) {
    return function () {
      if (typeof t === undefined || t-- > 0) {
        setTimeout(interv, w);
        try {
          func.call(null);
        } catch (e) {
          t = 0;
        }
      }
    };
  })(wait, time);
  setTimeout(interv, wait);
}

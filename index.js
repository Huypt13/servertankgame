//ws://tankserver1.herokuapp.com:80/socket.io/?EIO=3&transport=websocket
//ws://localhost:8080/socket.io/?EIO=3&transport=websocket
//https://tankserver1.herokuapp.com
//http://localhost:8080

const express = require("express");
const shortid = require("shortid");

const ServerHandle = require("./src/ServerHandle");
const Database = require("./src/database/Database");
const UserService = require("./src/database/User.Service");

const app = express();
const server = require("http").createServer(app);

Database.connect();
server.listen(process.env.PORT || 8080, () => {
  console.log("thanh cong");
});

const serverHanlder = new ServerHandle();

setInterval(() => {
  serverHanlder.onUpdate();
}, 50);

const io = require("socket.io")(server);
io.on("connection", (socket) => {
  socket.on("clientJoin", ({ username, id }) => {
    let connection = serverHanlder.onConnected(socket, { username, id });
    connection.createEvents();
    connection.socket.emit("register", { id: connection.player.id });
  });
});

// const a = (async function () {
//   console.log(await UserService.insertUser("huy1", "123"));
// })();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("hello world!");
});
// http
app.post("/", async (req, res) => {
  console.log(req.body);

  const userinfor = req.body;
  const user = await UserService.getUser(userinfor);
  if (user) {
    return res
      .status(200)
      .json({ status: "success", id: user?._id, username: user?.username });
  }
  return res
    .status(404)
    .json({ status: "error", message: "Invalid username or password" });
});
app.post("/create", async (req, res) => {
  console.log(req.body);
  const userinfor = req.body;
  const user = await UserService.insertUser(userinfor);
  if (user) {
    return res
      .status(200)
      .json({ status: "success", message: "Login to play" });
  }
  return res
    .status(404)
    .json({ status: "error", message: "Username has already been" });
});

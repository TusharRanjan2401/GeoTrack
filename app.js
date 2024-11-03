require("dotenv").config()
const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const { disconnect } = require("process");
const server = http.createServer(app);
const mongoose = require("mongoose")
const io = socketio(server);
const dbConnect = require("./config/dbConnect");
const { startKafkaProducer, startKafkaConsumer } = require("./service/kafka");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", function (socket) {
  socket.on("send-location", async (data) => {
    await startKafkaProducer(socket.id, data);
    io.emit("receive-location", { id: socket.id, ...data });
  });
  socket.on("disconnect", function () {
    console.log("User disconnected:", socket.id);
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

startKafkaConsumer();

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

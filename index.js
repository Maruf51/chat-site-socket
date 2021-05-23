const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
app.use(cors({
  cors: "103.112.55.34"
}))
const io = new Server(server, {
  cors: {
    origin: "103.112.55.34"
  }
});


let users = []

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === socketId) &&
    users.push({userId, socketId})
}

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId)
}

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on('connection', (socket) => {
  // when connect
  console.log('a user connected')
  // adding user to socket server
  socket.on('addUser', (userId) => {
    addUser(userId, socket.id)
    io.emit('getSocketUsers', users)
  })

  //send and get message
  socket.on("sendMessage", ({ messageId, sendId, receiverId, message }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        sendId,
        messageId,
        message,
      });
    }
  });

  // when disconnect
  socket.on('disconnect', () => {
    console.log('a user disconnected')
    removeUser(socket.id)
    io.emit('getSocketUsers', users)
  })
})

server.listen(8000, () => {
      console.log('listening on *:8000');
    });
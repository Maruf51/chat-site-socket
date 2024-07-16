const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
app.use(cors)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
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
  socket.on("sendMessage", ({ chatId, receiverId, message }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        chatId,
        message,
      });
    }
  });

  //delete message
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("deleteMessage", {
        messageId
      });
    }
  });

  //block user
  socket.on("blockUser", ({ chatId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("blockUser", {
        chatId,
        userId: receiverId
      });
    }
  });

  //new chat
  socket.on("newChat", ({ receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("newChat", {
        newChat: true
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

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:3000", // Adjust this to your frontend URL
    origin: "*", // Adjust this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// User management
let users = [];

const addUser = (userId, socketId) => {
  if (!users.some((user) => user.userId === userId && user.socketId === socketId)) {
    users.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Add user to users array
  socket.on('addUser', (userId) => {
    addUser(userId, socket.id);
    io.emit('getSocketUsers', users);
  });

  // Send and receive messages
  socket.on("sendMessage", ({ chatId, receiverId, message }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        chatId,
        message,
      });
    }
  });

  // Delete message
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("deleteMessage", {
        messageId
      });
    }
  });

  // Block user
  socket.on("blockUser", ({ chatId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("blockUser", {
        chatId,
        userId: receiverId
      });
    }
  });

  // New chat
  socket.on("newChat", ({ receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("newChat", {
        newChat: true
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    removeUser(socket.id);
    io.emit('getSocketUsers', users);
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

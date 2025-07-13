// Entry point for the chat server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Simple in-memory user store
let onlineUsers = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    onlineUsers[socket.id] = username;
    io.emit('online-users', Object.values(onlineUsers));
    socket.broadcast.emit('notification', `${username} joined the chat`);
  });

  socket.on('message', (data) => {
    io.emit('message', data);
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    io.emit('online-users', Object.values(onlineUsers));
    if (username) {
      socket.broadcast.emit('notification', `${username} left the chat`);
    }
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

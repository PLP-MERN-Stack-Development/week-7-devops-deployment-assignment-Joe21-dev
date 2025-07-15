// Entry point for the chat server
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

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
app.use(helmet());
app.use(morgan('combined'));

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

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Global error handler (should be after all other app.use/app.get)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

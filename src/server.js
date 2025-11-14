import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import chatRouter from './routes/chat.js';
import messageRouter from './routes/message.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat Application API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      chats: '/api/chats',
      messages: '/api/messages'
    }
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/chats', chatRouter);
app.use('/api/messages', messageRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.io connection handling
const onlineUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  // Store user's socket connection
  onlineUsers.set(socket.userId, socket.id);
  
  // Update user status to online
  await User.findByIdAndUpdate(socket.userId, { 
    status: 'online',
    lastSeen: new Date()
  });
  
  // Notify other users that this user is online
  socket.broadcast.emit('user-online', {
    userId: socket.userId,
    username: socket.username
  });
  
  // Join user to their personal room
  socket.join(socket.userId);
  
  // Join chat rooms
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`${socket.username} joined chat: ${chatId}`);
  });
  
  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`${socket.username} left chat: ${chatId}`);
  });
  
  // Send message
  socket.on('send-message', (data) => {
    const { chatId, message } = data;
    
    // Broadcast message to chat room
    io.to(chatId).emit('receive-message', {
      ...message,
      chatId
    });
  });
  
  // Typing indicator
  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(chatId).emit('user-typing', {
      userId: socket.userId,
      username: socket.username,
      chatId,
      isTyping
    });
  });
  
  // Message read receipt
  socket.on('message-read', (data) => {
    const { chatId, messageId } = data;
    io.to(chatId).emit('message-read-receipt', {
      messageId,
      userId: socket.userId,
      readAt: new Date()
    });
  });
  
  // User is viewing chat (for read receipts)
  socket.on('viewing-chat', (chatId) => {
    socket.to(chatId).emit('user-viewing', {
      userId: socket.userId,
      chatId
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.username} (${socket.userId})`);
    
    // Remove user from online users
    onlineUsers.delete(socket.userId);
    
    // Update user status to offline
    await User.findByIdAndUpdate(socket.userId, { 
      status: 'offline',
      lastSeen: new Date()
    });
    
    // Notify other users that this user is offline
    socket.broadcast.emit('user-offline', {
      userId: socket.userId,
      username: socket.username,
      lastSeen: new Date()
    });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});
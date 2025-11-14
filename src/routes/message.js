import express from 'express';
import {
  sendMessage,
  getChatMessages,
  markMessageAsRead,
  markChatAsRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/message.js';
import { authenticateToken } from '../middleware/auth.js';

const messageRouter = express.Router();

// All routes require authentication
messageRouter.use(authenticateToken);

// Send message
messageRouter.post('/', sendMessage);

// Get unread message count
messageRouter.get('/unread/count', getUnreadCount);

// Get messages for a chat
messageRouter.get('/chat/:chatId', getChatMessages);

// Mark message as read
messageRouter.put('/:messageId/read', markMessageAsRead);

// Mark all messages in chat as read
messageRouter.put('/chat/:chatId/read', markChatAsRead);

// Delete message
messageRouter.delete('/:messageId', deleteMessage);

export default messageRouter;
import express from 'express';
import {
  createOrGetChat,
  getUserChats,
  getChatById,
  createGroupChat,
  addParticipant,
  removeParticipant,
  deleteChat
} from '../controllers/chat.js';
import { authenticateToken } from '../middleware/auth.js';

const chatRouter = express.Router();

// All routes require authentication
chatRouter.use(authenticateToken);

// Get all chats for current user
chatRouter.get('/', getUserChats);

// Create or get one-on-one chat
chatRouter.post('/', createOrGetChat);

// Create group chat
chatRouter.post('/group', createGroupChat);

// Get chat by ID
chatRouter.get('/:chatId', getChatById);

// Add participant to group
chatRouter.post('/:chatId/participants', addParticipant);

// Remove participant from group
chatRouter.delete('/:chatId/participants', removeParticipant);

// Delete chat
chatRouter.delete('/:chatId', deleteChat);

export default chatRouter;
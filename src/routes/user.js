import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  searchUsers,
  getUserById,
  updateUserStatus
} from '../controllers/user.js';
import { authenticateToken } from '../middleware/auth.js';

const userRouter = express.Router();

// All routes require authentication
userRouter.use(authenticateToken);

// Get current user profile
userRouter.get('/profile', getUserProfile);

// Update user profile
userRouter.put('/profile', updateUserProfile);

// Change password
userRouter.put('/password', changePassword);

// Update user status
userRouter.put('/status', updateUserStatus);

// Search users
userRouter.get('/search', searchUsers);

// Get user by ID
userRouter.get('/:userId', getUserById);

export default userRouter;
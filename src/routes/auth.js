import express from 'express';
import { registerUser, loginUser, refreshToken } from '../controllers/authController.js';

const authrouter = express.Router();

authrouter.post('/register', registerUser);
authrouter.post('/login', loginUser);
authrouter.post('/refresh-token', refreshToken);

export default authrouter;
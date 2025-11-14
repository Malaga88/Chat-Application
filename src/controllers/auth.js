import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import bcrypt from 'bcryptjs';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
  );
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET
  );
  
  // Save refresh token to database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
  
  await RefreshToken.create({
    user: user._id,
    token,
    expiresAt
  });
  
  return token;
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email, and password' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    
    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      },
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({ token }).populate('user');
    if (!storedToken) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
    // Generate new access token
    const accessToken = generateAccessToken(storedToken.user);
    
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      // Remove refresh token from database
      await RefreshToken.deleteOne({ token });
    }
    
    // Update user status if available
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { 
        status: 'offline',
        lastSeen: new Date()
      });
    }
    
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
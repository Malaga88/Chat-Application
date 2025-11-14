import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Create or get one-on-one chat
export const createOrGetChat = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }
    
    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [req.user.id, userId] }
    })
    .populate('participants', 'username email avatar status lastSeen')
    .populate('lastMessage');
    
    if (chat) {
      return res.status(200).json({ chat });
    }
    
    // Create new chat
    chat = await Chat.create({
      participants: [req.user.id, userId],
      isGroupChat: false
    });
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('lastMessage');
    
    res.status(201).json({ 
      message: 'Chat created successfully',
      chat 
    });
  } catch (error) {
    console.error('Create or get chat error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all chats for current user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'username email avatar status lastSeen')
    .populate('lastMessage')
    .populate('groupAdmin', 'username email avatar')
    .sort({ updatedAt: -1 });
    
    res.status(200).json({ chats });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get chat by ID
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('lastMessage')
      .populate('groupAdmin', 'username email avatar');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json({ chat });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create group chat
export const createGroupChat = async (req, res) => {
  try {
    const { groupName, participants } = req.body;
    
    if (!groupName || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ 
        message: 'Group name and participants array are required' 
      });
    }
    
    if (participants.length < 2) {
      return res.status(400).json({ 
        message: 'Group chat must have at least 2 other participants' 
      });
    }
    
    // Add current user to participants
    const allParticipants = [...new Set([req.user.id, ...participants])];
    
    // Verify all participants exist
    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      return res.status(400).json({ message: 'Some users not found' });
    }
    
    // Create group chat
    let chat = await Chat.create({
      participants: allParticipants,
      isGroupChat: true,
      groupName,
      groupAdmin: req.user.id
    });
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('groupAdmin', 'username email avatar');
    
    res.status(201).json({ 
      message: 'Group chat created successfully',
      chat 
    });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Add participant to group
export const addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Only group chats can add participants' });
    }
    
    // Check if user is admin
    if (chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can add participants' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already participant
    if (chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }
    
    chat.participants.push(userId);
    await chat.save();
    
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('groupAdmin', 'username email avatar');
    
    res.status(200).json({ 
      message: 'Participant added successfully',
      chat: updatedChat 
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Remove participant from group
export const removeParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.isGroupChat) {
      return res.status(400).json({ 
        message: 'Only group chats can remove participants' 
      });
    }
    
    // Check if user is admin or removing themselves
    const isAdmin = chat.groupAdmin.toString() === req.user.id;
    const isSelf = userId === req.user.id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ 
        message: 'Only admin can remove participants' 
      });
    }
    
    // Don't allow removing admin
    if (userId === chat.groupAdmin.toString() && !isSelf) {
      return res.status(400).json({ message: 'Cannot remove group admin' });
    }
    
    chat.participants = chat.participants.filter(
      p => p.toString() !== userId
    );
    
    await chat.save();
    
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('groupAdmin', 'username email avatar');
    
    res.status(200).json({ 
      message: 'Participant removed successfully',
      chat: updatedChat 
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // For group chats, only admin can delete
    if (chat.isGroupChat && chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Only admin can delete group chat' 
      });
    }
    
    // Delete all messages in chat
    await Message.deleteMany({ chat: chatId });
    
    // Delete chat
    await Chat.findByIdAndDelete(chatId);
    
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
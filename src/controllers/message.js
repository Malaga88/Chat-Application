import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl } = req.body;
    
    if (!chatId || !content) {
      return res.status(400).json({ 
        message: 'Chat ID and content are required' 
      });
    }
    
    // Check if chat exists
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
    
    // Create message
    let message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
      messageType,
      fileUrl,
      readBy: [{ user: req.user.id }]
    });
    
    // Update chat's last message and updatedAt
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();
    
    // Populate message
    message = await Message.findById(message._id)
      .populate('sender', 'username email avatar')
      .populate('chat');
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      data: message 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get messages for a chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Message.countDocuments({ chat: chatId });
    
    res.status(200).json({ 
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is in the chat
    const chat = await Chat.findById(message.chat);
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if already marked as read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user.id
    );
    
    if (!alreadyRead) {
      message.readBy.push({ user: req.user.id, readAt: new Date() });
      await message.save();
    }
    
    res.status(200).json({ 
      message: 'Message marked as read',
      data: message 
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Mark all messages in chat as read
export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find all unread messages
    const messages = await Message.find({
      chat: chatId,
      'readBy.user': { $ne: req.user.id }
    });
    
    // Mark all as read
    for (const message of messages) {
      message.readBy.push({ user: req.user.id, readAt: new Date() });
      await message.save();
    }
    
    res.status(200).json({ 
      message: 'All messages marked as read',
      count: messages.length 
    });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender can delete message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Only sender can delete message' 
      });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    // Update chat's last message if this was it
    const chat = await Chat.findById(message.chat);
    if (chat.lastMessage && chat.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({ chat: message.chat })
        .sort({ createdAt: -1 });
      chat.lastMessage = lastMessage ? lastMessage._id : null;
      await chat.save();
    }
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    // Get all chats user is part of
    const chats = await Chat.find({ participants: req.user.id });
    const chatIds = chats.map(chat => chat._id);
    
    // Count unread messages
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id }
    });
    
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
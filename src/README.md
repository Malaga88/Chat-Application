# Chat Application Backend

A comprehensive real-time chat application backend built with Node.js, Express, MongoDB, and Socket.io.

## Features

### Authentication & User Management
- ✅ User registration and login with JWT
- ✅ Access token and refresh token system
- ✅ Password hashing with bcrypt
- ✅ User profile management
- ✅ User search functionality
- ✅ Online/offline status tracking

### Chat Features
- ✅ One-on-one private messaging
- ✅ Group chat creation and management
- ✅ Add/remove participants from groups
- ✅ Chat history with pagination
- ✅ Message read receipts
- ✅ Unread message count

### Real-time Features (Socket.io)
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ Online/offline status updates
- ✅ Message read receipts
- ✅ User presence tracking

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Malaga88/Chat-Application.git
cd Chat-Application/src
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Socket.io**
```bash
npm install socket.io
```

4. **Set up environment variables**
Create a `.env` file in the `src` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chat-app
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
ACCESS_TOKEN_EXPIRES=15m
CLIENT_URL=http://localhost:3000
```

5. **Start the server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Project Structure

```
src/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── auth.js              # Authentication logic
│   ├── user.js              # User management
│   ├── chat.js              # Chat operations
│   └── message.js           # Message operations
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User schema
│   ├── Chat.js              # Chat schema
│   ├── Message.js           # Message schema
│   └── RefreshToken.js      # Refresh token schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── user.js              # User routes
│   ├── chat.js              # Chat routes
│   └── messages.js          # Message routes
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Dependencies
└── server.js                # Main server file
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "token": "refresh_token_here"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "token": "refresh_token_here"
}
```

### User Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer {access_token}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "new_username",
  "avatar": "avatar_url",
  "status": "online"
}
```

#### Change Password
```http
PUT /api/users/password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

#### Search Users
```http
GET /api/users/search?query=john
Authorization: Bearer {access_token}
```

#### Get User by ID
```http
GET /api/users/{userId}
Authorization: Bearer {access_token}
```

#### Update Status
```http
PUT /api/users/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "away"
}
```

### Chat Endpoints

#### Get All Chats
```http
GET /api/chats
Authorization: Bearer {access_token}
```

#### Create or Get One-on-One Chat
```http
POST /api/chats
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "userId": "other_user_id"
}
```

#### Create Group Chat
```http
POST /api/chats/group
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "groupName": "My Group",
  "participants": ["user_id_1", "user_id_2"]
}
```

#### Get Chat by ID
```http
GET /api/chats/{chatId}
Authorization: Bearer {access_token}
```

#### Add Participant to Group
```http
POST /api/chats/{chatId}/participants
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "userId": "user_id"
}
```

#### Remove Participant
```http
DELETE /api/chats/{chatId}/participants
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "userId": "user_id"
}
```

#### Delete Chat
```http
DELETE /api/chats/{chatId}
Authorization: Bearer {access_token}
```

### Message Endpoints

#### Send Message
```http
POST /api/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "chatId": "chat_id",
  "content": "Hello!",
  "messageType": "text"
}
```

#### Get Chat Messages
```http
GET /api/messages/chat/{chatId}?page=1&limit=50
Authorization: Bearer {access_token}
```

#### Mark Message as Read
```http
PUT /api/messages/{messageId}/read
Authorization: Bearer {access_token}
```

#### Mark All Chat Messages as Read
```http
PUT /api/messages/chat/{chatId}/read
Authorization: Bearer {access_token}
```

#### Delete Message
```http
DELETE /api/messages/{messageId}
Authorization: Bearer {access_token}
```

#### Get Unread Count
```http
GET /api/messages/unread/count
Authorization: Bearer {access_token}
```

## Socket.io Events

### Client to Server

#### Connect
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_access_token'
  }
});
```

#### Join Chat
```javascript
socket.emit('join-chat', chatId);
```

#### Leave Chat
```javascript
socket.emit('leave-chat', chatId);
```

#### Send Message
```javascript
socket.emit('send-message', {
  chatId: 'chat_id',
  message: messageObject
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  chatId: 'chat_id',
  isTyping: true
});
```

#### Message Read
```javascript
socket.emit('message-read', {
  chatId: 'chat_id',
  messageId: 'message_id'
});
```

#### Viewing Chat
```javascript
socket.emit('viewing-chat', chatId);
```

### Server to Client

#### User Online
```javascript
socket.on('user-online', (data) => {
  console.log(`${data.username} is online`);
});
```

#### User Offline
```javascript
socket.on('user-offline', (data) => {
  console.log(`${data.username} is offline`);
});
```

#### Receive Message
```javascript
socket.on('receive-message', (data) => {
  console.log('New message:', data);
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log(`${data.username} is typing...`);
});
```

#### Message Read Receipt
```javascript
socket.on('message-read-receipt', (data) => {
  console.log('Message read:', data);
});
```

#### User Viewing
```javascript
socket.on('user-viewing', (data) => {
  console.log(`User viewing chat: ${data.chatId}`);
});
```

## Error Handling

All API responses follow this format:

### Success Response
```json
{
  "message": "Success message",
  "data": { }
}
```

### Error Response
```json
{
  "message": "Error message",
  "error": "Error details"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Refresh token rotation
- ✅ CORS protection
- ✅ Input validation
- ✅ MongoDB injection prevention

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGO_URI` | MongoDB connection string | - |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | - |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | - |
| `ACCESS_TOKEN_EXPIRES` | Access token expiry | 15m |
| `CLIENT_URL` | Client URL for CORS | http://localhost:3000 |

## Database Schema

### User
- `username` (String, unique, required)
- `email` (String, unique, required)
- `password` (String, required, hashed)
- `avatar` (String)
- `status` (String: online/offline/away)
- `lastSeen` (Date)
- `createdAt` (Date)

### Chat
- `participants` (Array of User IDs)
- `isGroupChat` (Boolean)
- `groupName` (String)
- `groupAdmin` (User ID)
- `lastMessage` (Message ID)
- `createdAt` (Date)
- `updatedAt` (Date)

### Message
- `chat` (Chat ID)
- `sender` (User ID)
- `content` (String)
- `messageType` (String: text/image/file)
- `fileUrl` (String)
- `readBy` (Array of User IDs with timestamps)
- `createdAt` (Date)
- `updatedAt` (Date)

### RefreshToken
- `user` (User ID)
- `token` (String, unique)
- `createdAt` (Date)
- `expiresAt` (Date)

## Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- curl commands
- Your custom frontend

### Example curl Request
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Your Name

## Support

For issues and questions, please open an issue on GitHub.

---

**Happy Coding! 🚀**
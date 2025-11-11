import 'dotenv/config';
import express from 'express';  
import connectDB from './config/db.js';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Define routes (example route)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
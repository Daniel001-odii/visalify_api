// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import Routes (ensure paths are correct)
import authRoutes from './routes/authRoutes.js';
import visaRoutes from './routes/visaRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:3000', // Local frontend
  'https://ai-visa-prep.vercel.app', // Online frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};

// Call the MongoDB connection function
connectToMongoDB();

// Routes
app.use('/api/auth', authRoutes); // Auth endpoints (register, login)
app.use('/api/visa', visaRoutes); // Visa Interview API
app.use('/api/user', userRoutes); // User Profile CRUD

// Root route
app.get('/', async (req, res) => {
  res.send('Your API is live!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the app (useful for testing or serverless deployment)
export default app;
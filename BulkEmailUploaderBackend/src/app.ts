import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { UploadController } from './controllers/upload.controller';
import { EmailController } from './controllers/email.controller';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/email_sender')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/upload', upload.single('file'), UploadController.uploadExcel);
app.get('/api/emails', EmailController.getEmailLogs);

export { app };
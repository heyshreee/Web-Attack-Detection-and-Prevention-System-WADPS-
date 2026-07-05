import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Protected Routes (Requires verified JWT token header)
router.get('/me', authMiddleware, getMe);

export default router;

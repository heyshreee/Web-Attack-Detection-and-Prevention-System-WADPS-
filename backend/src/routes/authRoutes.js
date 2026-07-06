import express from 'express';
import { register, login, getMe, resetIP } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-ip', resetIP);

// Protected Routes (Requires verified JWT token header)
router.get('/me', authMiddleware, getMe);

export default router;

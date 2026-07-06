import express from 'express';
import { getStats, getTimeline, getAnalytics } from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, getStats);
router.get('/timeline', authMiddleware, getTimeline);
router.get('/analytics', authMiddleware, getAnalytics);

export default router;

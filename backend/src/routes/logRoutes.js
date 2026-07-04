import express from 'express';
import { getAttackLogs, getRequestLogs, exportLogs, deleteLog } from '../controllers/logController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/attacks', authMiddleware, getAttackLogs);
router.get('/requests', authMiddleware, getRequestLogs);
router.get('/export', authMiddleware, exportLogs);
router.delete('/attacks/:id', authMiddleware, deleteLog);

export default router;

import express from 'express';
import { getAlerts, markRead, clearAll, deleteAlert } from '../controllers/alertController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAlerts);
router.put('/:id/read', authMiddleware, markRead);
router.post('/clear', authMiddleware, clearAll);
router.delete('/:id', authMiddleware, deleteAlert);

export default router;

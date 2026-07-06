import express from 'express';
import { simulateXSS } from '../controllers/simulatorController.js';

const router = express.Router();

// Maps to: POST /api/xss-machine/render
router.post('/render', simulateXSS);
router.get('/render', (req, res) => {
  res.status(200).json({ message: 'Send a POST request with { payload, secured }' });
});

export default router;

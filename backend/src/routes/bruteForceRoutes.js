import express from 'express';
import { simulateBruteForce } from '../controllers/simulatorController.js';

const router = express.Router();

// Maps to: POST /api/brute-force-machine/login
router.post('/login', simulateBruteForce);
router.get('/login', (req, res) => {
  res.status(200).json({ message: 'Send a POST request with { email, password, secured }' });
});

export default router;

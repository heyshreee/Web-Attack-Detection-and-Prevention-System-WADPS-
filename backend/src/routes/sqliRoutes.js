import express from 'express';
import { searchUsers } from '../controllers/sqliController.js';

const router = express.Router();

// Define query search endpoint
router.post('/search', searchUsers);
// Fallback query get search
router.get('/search', (req, res) => {
  res.status(200).json({ message: 'Send a POST request with { username, secured }' });
});

export default router;

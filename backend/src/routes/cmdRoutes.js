import express from 'express';
import { simulateCMD } from '../controllers/simulatorController.js';

const router = express.Router();

// Maps to: POST /api/cmd-machine/exec
router.post('/exec', simulateCMD);
router.get('/exec', (req, res) => {
  res.status(200).json({ message: 'Send a POST request with { payload, secured }' });
});

export default router;

import express from 'express';
import { simulateScanner } from '../controllers/simulatorController.js';

const router = express.Router();

// Maps to: GET /api/scanner-machine/scan
router.get('/scan', simulateScanner);

export default router;

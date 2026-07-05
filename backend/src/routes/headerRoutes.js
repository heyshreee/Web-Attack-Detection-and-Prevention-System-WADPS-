import express from 'express';
import { simulateSuspiciousHeader } from '../controllers/simulatorController.js';

const router = express.Router();

// Maps to: GET /api/header-machine/check
router.get('/check', simulateSuspiciousHeader);

export default router;

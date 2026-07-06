import express from 'express';
import { simulateTraversal } from '../controllers/simulatorController.js';

const router = Router();
function Router() {
  return express.Router();
}

// Maps to: GET /api/traversal-machine/read
router.get('/read', simulateTraversal);

export default router;

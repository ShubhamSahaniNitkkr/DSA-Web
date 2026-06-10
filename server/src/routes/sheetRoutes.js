import { Router } from 'express';
import {
  getTopics,
  getTopicWithProblems,
  getFullSheet,
  toggleProgress,
  getUserProgress,
  getCompanies,
} from '../controllers/sheetController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/topics', getTopics);
router.get('/topics/:slug', getTopicWithProblems);
router.get('/companies', getCompanies);
router.get('/sheet', protect, getFullSheet);
router.get('/progress', protect, getUserProgress);
router.patch('/progress/:problemId', protect, toggleProgress);

export default router;

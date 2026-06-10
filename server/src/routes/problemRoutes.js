import { Router } from 'express';
import {
  getProblemDetail,
  saveNote,
  toggleFavorite,
  setReaction,
  runCode,
} from '../controllers/problemController.js';
import { getProblemTimeHistory, getProblemInsights } from '../controllers/timeController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/:slug/time-history', protect, getProblemTimeHistory);
router.get('/:slug/insights', protect, getProblemInsights);
router.get('/:slug', protect, getProblemDetail);
router.put('/:slug/note', protect, saveNote);
router.post('/:slug/favorite', protect, toggleFavorite);
router.post('/:slug/reaction', protect, setReaction);
router.post('/:slug/run', protect, runCode);

export default router;

import { Router } from 'express';
import { getQuizForProblem, submitQuizAnswer } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/problem/:slug', protect, getQuizForProblem);
router.post('/submit', protect, submitQuizAnswer);

export default router;

import { Router } from 'express';
import { getDashboard, getDashboardFull, recordFocus, getFavorites, getLastVisited } from '../controllers/dashboardController.js';
import { syncTime, getTimeStats } from '../controllers/timeController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getDashboard);
router.get('/full', protect, getDashboardFull);
router.post('/focus', protect, recordFocus);
router.post('/time', protect, syncTime);
router.get('/time-stats', protect, getTimeStats);
router.get('/favorites', protect, getFavorites);
router.get('/last-visited', protect, getLastVisited);

export default router;

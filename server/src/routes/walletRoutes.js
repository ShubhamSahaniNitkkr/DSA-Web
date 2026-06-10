import { Router } from 'express';
import { getWallet, requestWithdrawal } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getWallet);
router.post('/request', protect, requestWithdrawal);

export default router;

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatePreferences,
  updateAvatar,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerRules, loginRules, validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.patch('/preferences', protect, updatePreferences);
router.patch('/avatar', protect, updateAvatar);

export default router;

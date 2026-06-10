import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  verifyInviteeEmail,
  startCollab,
  previewCollabInvite,
  getCollabInvite,
  acceptCollab,
} from '../controllers/collabController.js';

const router = Router();

router.get('/verify-email', protect, verifyInviteeEmail);
router.post('/start', protect, startCollab);
router.get('/:token/preview', previewCollabInvite);
router.get('/:token', protect, getCollabInvite);
router.post('/:token/accept', protect, acceptCollab);

export default router;

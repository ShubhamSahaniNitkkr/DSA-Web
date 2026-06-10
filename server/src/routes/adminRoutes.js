import { Router } from 'express';
import {
  getAdminData,
  upsertTopic,
  upsertProblem,
  deleteProblem,
  upsertQuiz,
  updateWithdrawalStatus,
} from '../controllers/adminController.js';
import { downloadExcel } from '../controllers/excelController.js';
import { importCsv, exportCsv } from '../controllers/importController.js';
import { importExcel } from '../controllers/excelController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { adminGate, verifyAdminGate } from '../middleware/adminGate.js';
import { getAnalytics } from '../controllers/adminAnalyticsController.js';
import { uploadExcel, uploadCsv } from '../middleware/upload.js';

const router = Router();

router.post('/verify-gate', protect, adminOnly, verifyAdminGate);

router.use(protect, adminOnly, adminGate);

router.get('/', getAdminData);
router.get('/analytics', getAnalytics);
router.get('/export-excel', downloadExcel);
router.get('/export-csv/:type', exportCsv);
router.post('/import-excel', uploadExcel.single('file'), importExcel);
router.post('/import-csv', uploadCsv.array('files', 5), importCsv);
router.post('/topics', upsertTopic);
router.post('/problems', upsertProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/quiz', upsertQuiz);
router.patch('/withdrawals/:id', updateWithdrawalStatus);

export default router;

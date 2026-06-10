import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadExcel = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith('.xlsx') || file.mimetype.includes('spreadsheet');
    cb(ok ? null : new Error('Only .xlsx files allowed'), ok);
  },
});

export const uploadCsv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith('.csv') || file.mimetype === 'text/csv';
    cb(ok ? null : new Error('Only .csv files allowed'), ok);
  },
});

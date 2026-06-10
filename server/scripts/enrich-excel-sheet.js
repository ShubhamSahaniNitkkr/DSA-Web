/**
 * Fill missing Problem Statement & Examples in docs/strivers-a2z-dsa.xlsx
 * Usage: node server/scripts/enrich-excel-sheet.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import XLSX from 'xlsx';
import { extractProblemStatement, enrichExamples } from '../src/utils/sheetEnrich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../docs/strivers-a2z-dsa.xlsx');
const BACKUP_PATH = path.resolve(__dirname, '../../docs/strivers-a2z-dsa.backup.xlsx');

function run() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Missing:', XLSX_PATH);
    process.exit(1);
  }

  fs.copyFileSync(XLSX_PATH, BACKUP_PATH);
  console.log('Backup:', BACKUP_PATH);

  const wb = XLSX.readFile(XLSX_PATH);
  const sheetName = wb.SheetNames.find((n) => /a2z|dsa/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

  let stmtFilled = 0;
  let exFilled = 0;

  for (const row of rows) {
    const beforeStmt = String(row['Problem Statement'] || '').trim();
    const enriched = extractProblemStatement(row);
    if (!beforeStmt && enriched) {
      row['Problem Statement'] = enriched;
      stmtFilled++;
    } else if (beforeStmt.length < 40 && enriched.length > beforeStmt.length) {
      row['Problem Statement'] = enriched;
      stmtFilled++;
    }

    if (!String(row['Examples'] || '').trim()) {
      const ex = enrichExamples(row);
      if (ex) {
        row['Examples'] = ex;
        exFilled++;
      }
    }
  }

  const newSheet = XLSX.utils.json_to_sheet(rows);
  wb.Sheets[sheetName] = newSheet;
  XLSX.writeFile(wb, XLSX_PATH);

  const withStmt = rows.filter((r) => String(r['Problem Statement'] || '').trim().length > 30).length;
  console.log(`Enriched statements: ${stmtFilled}, examples: ${exFilled}`);
  console.log(`Total rows with statement: ${withStmt}/${rows.length}`);
  console.log('Saved:', XLSX_PATH);
}

run();

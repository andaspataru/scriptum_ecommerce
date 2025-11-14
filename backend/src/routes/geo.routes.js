import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const CSV_PATH =
  process.env.GEO_CSV_PATH ||
  path.resolve(process.cwd(), 'src', 'data', 'localitati.csv');

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const header = splitCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
  const idx = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iJud = idx('judet');
  const iNum = idx('nume');
  const iDia = idx('diacritice');
  const iZip = idx('zip');

  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const get = (j) => (j >= 0 && j < cols.length ? cols[j].replace(/^"|"$/g, '') : '');
    const r = {
      judet: get(iJud),
      nume: get(iNum),
      diacritice: get(iDia),
      zip: get(iZip) || undefined,
    };
    if (r.judet && (r.diacritice || r.nume)) out.push(r);
  }
  return out;
}

const router = Router();

let rows = [];
let judete = [];

function loadCSV() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[geo] CSV inexistent: ${CSV_PATH}`);
    rows = [];
    judete = [];
    return;
  }
  const txt = fs.readFileSync(CSV_PATH, 'utf8');
  rows = parseCSV(txt);
  const set = new Set();
  rows.forEach((r) => r.judet && set.add(r.judet));
  judete = Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  console.log(`[geo] Loaded ${rows.length} localități din ${CSV_PATH}`);
}

loadCSV();

router.get('/judete', (_req, res) => {
  if (!judete.length) return res.status(500).json({ error: 'CSV negăsit sau gol.' });
  res.json(judete);
});

router.get('/localitati', (req, res) => {
  const jud = String(req.query.judet || '');
  if (!jud) return res.status(400).json({ error: 'Parametrul judet este obligatoriu.' });
  if (!rows.length) return res.status(500).json({ error: 'CSV negăsit sau gol.' });

  const list = rows
    .filter((r) => r.judet === jud)
    .map((r) => ({ label: r.diacritice || r.nume, value: r.diacritice || r.nume, zip: r.zip }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ro'));

  res.json(list);
});

export default router;

// ✅ MobSF Proxy Backend - server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const upload = multer({ dest: path.join(__dirname, 'tmp/') });
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const aiService = require('./aiService.js');

// ✅ Directories for saved reports
const REPORTS_DIR = path.join(__dirname, 'reports');
const JSON_DIR = path.join(REPORTS_DIR, 'json');
const PDF_DIR = path.join(REPORTS_DIR, 'pdf');
[REPORTS_DIR, JSON_DIR, PDF_DIR].forEach(d => {
  try { fs.mkdirSync(d, { recursive: true }); } catch { }
});

// ✅ MobSF Config
const MOBSF_URL = process.env.MOBSF_URL || 'http://localhost:8000';
const MOBSF_API_KEY = process.env.MOBSF_API_KEY;
if (!MOBSF_API_KEY) {
  console.error('❌ MOBSF_API_KEY not found in .env');
  process.exit(1);
}
console.log('Using MOBSF_URL:', MOBSF_URL);
console.log('Using MOBSF_API_KEY:', MOBSF_API_KEY.slice(0, 6) + '...' + MOBSF_API_KEY.slice(-6));

const mobHeaders = () => ({
  Authorization: MOBSF_API_KEY,
  'X-Mobsf-Api-Key': MOBSF_API_KEY,
});

// Helper: handle and forward proxy errors clearly
function sendProxyError(res, err) {
  const status = err?.response?.status || 500;
  const body = err?.response?.data || { message: err.message };
  console.error(`Proxy error (${status}):`, JSON.stringify(body, null, 2));
  res.status(status).json({ error: body });
}

// ✅ 1. Upload File
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(422).json({ error: 'No file provided' });
    const filePath = req.file.path;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), req.file.originalname);

    console.log('Forwarding upload to MobSF...');
    const resp = await axios.post(`${MOBSF_URL}/api/v1/upload`, form, {
      headers: { ...form.getHeaders(), ...mobHeaders() },
      maxBodyLength: Infinity,
    });

    fs.unlinkSync(filePath); // clean temp
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 2. Trigger Scan
app.post('/api/scan', async (req, res) => {
  try {
    const { hash, re_scan } = req.body;
    if (!hash) return res.status(422).json({ error: 'hash required' });

    const data = new URLSearchParams();
    data.append('hash', hash);
    if (re_scan) data.append('re_scan', '1');

    console.log('Triggering scan in MobSF...');
    const resp = await axios.post(`${MOBSF_URL}/api/v1/scan`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 3. Get JSON Report
app.get('/api/report_json', async (req, res) => {
  try {
    const { hash } = req.query;
    if (!hash) return res.status(422).json({ error: 'hash query param required' });

    const data = new URLSearchParams();
    data.append('hash', hash);

    console.log('Fetching JSON report from MobSF...');
    const resp = await axios.post(`${MOBSF_URL}/api/v1/report_json`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 4. Get "Crucial" summary from JSON Report
app.get('/api/report_json/crucial', async (req, res) => {
  try {
    const { hash } = req.query;
    if (!hash) return res.status(422).json({ error: 'hash query param required' });

    const data = new URLSearchParams();
    data.append('hash', hash);
    const resp = await axios.post(`${MOBSF_URL}/api/v1/report_json`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });

    const report = resp.data;
    const keywords = ['insecure', 'weak', 'hardcoded', 'exported', 'adb', 'root', 'sensitive', 'sql', 'crypto', 'ssl', 'http', 'plain', 'permission', 'dangerous', 'secret', 'keystore', 'iv', 'key'];
    const findings = [];
    function search(obj, path = []) {
      if (!obj) return;
      if (typeof obj === 'string') {
        const l = obj.toLowerCase();
        for (const k of keywords) if (l.includes(k)) { findings.push({ path: path.join('.'), snippet: obj }); break; }
      } else if (Array.isArray(obj)) obj.forEach((v, i) => search(v, [...path, `[${i}]`]));
      else if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const l = key.toLowerCase();
          for (const k of keywords) if (l.includes(k)) { findings.push({ path: [...path, key].join('.'), snippet: JSON.stringify(val).slice(0, 200) }); break; }
          search(val, [...path, key]);
        }
      }
    }
    search(report);

    const seen = new Set();
    const unique = findings.filter(f => { const k = `${f.path}|${f.snippet}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 50);

    res.json({ hash, count: unique.length, findings: unique });
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 5. Scan Logs
app.post('/api/scan_logs', async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash) return res.status(422).json({ error: 'hash required' });
    const data = new URLSearchParams(); data.append('hash', hash);

    const resp = await axios.post(`${MOBSF_URL}/api/v1/scan_logs`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 6. Save & Serve JSON Reports
app.get('/api/report_json/save', async (req, res) => {
  try {
    const { hash } = req.query;
    if (!hash) return res.status(422).json({ error: 'hash required' });

    const destPath = path.join(JSON_DIR, `${hash}.json`);
    if (fs.existsSync(destPath)) {
      const data = JSON.parse(fs.readFileSync(destPath, 'utf8'));
      return res.json({ cached: true, path: `/reports/json/${hash}`, data });
    }

    const dataPayload = new URLSearchParams(); dataPayload.append('hash', hash);
    const resp = await axios.post(`${MOBSF_URL}/api/v1/report_json`, dataPayload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });

    fs.writeFileSync(destPath, JSON.stringify(resp.data, null, 2), 'utf8');
    res.json({ cached: false, path: `/reports/json/${hash}`, data: resp.data });
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 7. Save & Serve PDF Reports
app.get('/api/download_pdf/save', async (req, res) => {
  try {
    const { hash } = req.query;
    if (!hash) return res.status(422).json({ error: 'hash required' });

    const destPath = path.join(PDF_DIR, `${hash}.pdf`);
    if (fs.existsSync(destPath)) return res.sendFile(destPath);

    const data = new URLSearchParams(); data.append('hash', hash);
    const resp = await axios.post(`${MOBSF_URL}/api/v1/download_pdf`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(destPath, Buffer.from(resp.data), 'binary');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(destPath);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 8. Serve static saved reports
app.use('/reports/json', express.static(JSON_DIR));
app.use('/reports/pdf', express.static(PDF_DIR));

// ✅ 9. List Saved Reports
app.get('/api/reports', (req, res) => {
  try {
    const jsonFiles = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
    const reports = jsonFiles.map(fn => {
      const hash = path.basename(fn, '.json');
      const stat = fs.statSync(path.join(JSON_DIR, fn));
      const entry = { hash, jsonPath: `/reports/json/${hash}`, jsonUpdated: stat.mtime };
      if (pdfFiles.includes(`${hash}.pdf`)) entry.pdfPath = `/reports/pdf/${hash}`;
      return entry;
    });
    res.json({ count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 10. Recent Scans
app.get('/api/scans', async (req, res) => {
  try {
    const url = `${MOBSF_URL}/api/v1/scans?page=1&page_size=10`;
    const resp = await axios.get(url, { headers: mobHeaders() });
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 11.5. Manifest View
app.post('/api/manifest_view', async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash) return res.status(422).json({ error: 'hash required' });

    const data = new URLSearchParams();
    data.append('hash', hash);
    data.append('file', 'AndroidManifest.xml');
    data.append('type', 'apk');

    console.log('Fetching Manifest from MobSF...');
    const resp = await axios.post(`${MOBSF_URL}/api/v1/view_source`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...mobHeaders() },
    });
    res.json(resp.data);
  } catch (err) {
    sendProxyError(res, err);
  }
});

// ✅ 12. AI Explain Endpoint
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(422).json({ error: 'Query required' });

    const explanation = await aiService.explain(query);
    res.json(explanation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 12. Analytics Endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
    const totalScans = files.length;

    let totalScore = 0;
    const severityCounts = { high: 0, medium: 0, info: 0, secure: 0 };
    const vulnerabilityCounts = {};
    const recentScores = []; // { date, score }

    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(JSON_DIR, file), 'utf8');
        const data = JSON.parse(content);

        // Score
        // MobSF score is often in data.average_cvss or calculated. 
        // We'll use a simple heuristic if not present: 100 - (5*high + 2*medium)
        let score = 0;
        // Try to find a score in the report or calculate one
        // Heuristic calculation based on findings
        const manifest = data.manifest_analysis || data.Manifest || {};
        const code = data.code_analysis?.findings || {};
        const perms = data.permissions || {};

        let high = 0, medium = 0, info = 0;

        // Count Manifest
        const mFindings = manifest.manifest_findings || manifest.findings || [];
        mFindings.forEach(f => {
          const s = (f.severity || '').toLowerCase();
          if (s.includes('high')) high++;
          else if (s.includes('warn') || s.includes('medium')) medium++;
          else info++;

          // Track title
          const title = f.title || f.name;
          if (title) vulnerabilityCounts[title] = (vulnerabilityCounts[title] || 0) + 1;
        });

        // Count Code
        Object.entries(code).forEach(([key, val]) => {
          const s = (val.metadata?.severity || '').toLowerCase();
          if (s.includes('high')) high++;
          else if (s.includes('warn') || s.includes('medium')) medium++;
          else info++;

          const title = val.metadata?.description || key;
          if (title) vulnerabilityCounts[title] = (vulnerabilityCounts[title] || 0) + 1;
        });

        // Count Permissions (Dangerous)
        Object.entries(perms).forEach(([perm, details]) => {
          const status = details.status || details.level || '';
          if (/(dangerous|danger)/i.test(status)) {
            high++;
            vulnerabilityCounts[perm] = (vulnerabilityCounts[perm] || 0) + 1;
          }
        });

        // Calculate Score (0-100)
        score = Math.max(0, 100 - (high * 10) - (medium * 5));
        totalScore += score;

        // Aggregates
        severityCounts.high += high;
        severityCounts.medium += medium;
        severityCounts.info += info;

        // Date for trend
        const stat = fs.statSync(path.join(JSON_DIR, file));
        recentScores.push({
          date: stat.mtime.toISOString().split('T')[0], // YYYY-MM-DD
          score: score,
          hash: file.replace('.json', '')
        });

      } catch (e) {
        console.error(`Error processing ${file} for analytics:`, e.message);
      }
    });

    const avgScore = totalScans > 0 ? Math.round(totalScore / totalScans) : 0;

    // Sort recent scores by date
    recentScores.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Top 5 Vulnerabilities
    const topVulnerabilities = Object.entries(vulnerabilityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalScans,
      avgScore,
      severityCounts,
      topVulnerabilities,
      recentScores
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend proxy running on port ${PORT}`);
});

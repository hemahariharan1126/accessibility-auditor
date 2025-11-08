const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware (set up before all routes) ---
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.json());

// --- Favicon handler ---
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- Audit Endpoint ---
app.post('/api/audit', async (req, res) => {
  console.log('==========================================');
  console.log('📥 Received audit request');

  const { url } = req.body;

  // Validation: Check if URL exists and is a string
  if (!url || typeof url !== 'string') {
    console.log('❌ Error: No URL provided or invalid type');
    return res.status(400).json({
      error: 'URL is required and must be a string'
    });
  }

  // Validation: Check if URL is valid
  try {
    new URL(url);
  } catch (error) {
    console.log('❌ Invalid URL format:', url);
    return res.status(400).json({
      error: 'Invalid URL format',
      message: 'URL must be a valid web address (e.g., https://example.com)'
    });
  }

  try {
    console.log(`🔍 Attempting to load auditor module...`);
    const { runFullAudit } = require('../auditor/mainAuditor');
    console.log('✅ Auditor module loaded successfully');

    console.log(`🌐 Starting audit for URL: ${url}`);
    const results = await runFullAudit(url);

    console.log('✅ Audit completed successfully');
    console.log('Results summary:', results.summary);
    console.log('==========================================');

    res.json(results);

  } catch (error) {
    console.log('==========================================');
    console.error('❌ AUDIT FAILED');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('==========================================');

    res.status(500).json({
      error: 'Audit failed',
      message: error.message
    });
  }
});

// --- HTML Report Export Route ---
app.post('/api/report/html', async (req, res) => {
  const { url } = req.body;
  const { runFullAudit } = require('../auditor/mainAuditor');
  try {
    const results = await runFullAudit(url);
    const html = `
      <html>
        <head><title>Accessibility Report</title></head>
        <body>
          <h1>Accessibility Report for ${url}</h1>
          <pre>${JSON.stringify(results, null, 2)}</pre>
        </body>
      </html>
    `;
    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="accessibility-report.html"'
    });
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PDF Report Export Route (FIXED) ---
app.post('/api/report/pdf', async (req, res) => {
  const { url } = req.body;
  const { runFullAudit } = require('../auditor/mainAuditor');
  try {
    const results = await runFullAudit(url);
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Accessibility Report for ${url}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2em; }
            h1 { color: #667eea; }
            .section { margin-bottom: 2em; }
            pre { background: #f8f8f8; padding: 1em; border-radius: 0.5em; }
            .stat { font-weight: bold; margin-bottom: 1em; }
          </style>
        </head>
        <body>
          <h1>Accessibility Report</h1>
          <div class="stat">URL: ${url}</div>
          <div class="stat">Audit at: ${results.timestamp}</div>
          <div class="section">
            <h2>Summary</h2>
            <pre>${JSON.stringify(results.summary, null, 2)}</pre>
          </div>
          <div class="section">
            <h2>Critical Issues</h2>
            <pre>${JSON.stringify(results.critical, null, 2)}</pre>
          </div>
          <div class="section">
            <h2>Warnings</h2>
            <pre>${JSON.stringify(results.warnings, null, 2)}</pre>
          </div>
          <div class="section">
            <h2>Suggestions</h2>
            <pre>${JSON.stringify(results.suggestions, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
    // Puppeteer with safe launch flags (needed especially on Linux/Win)
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="accessibility-report.pdf"'
    });
    res.send(pdfBuffer);
  } catch (err) {
    // Log actual error for diagnosing PDF generation
    console.error('PDF Export Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- 404 Handler ---
app.use((req, res) => {
  console.log('404 - Not found:', req.url);
  res.status(404).json({ error: 'Not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log('==========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files: ${path.join(__dirname, '../../public')}`);
  console.log('==========================================');
});

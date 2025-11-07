// Vercel Serverless function for /api/audit
const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium');
const { AxeBuilder } = require('@axe-core/puppeteer');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🔍 Starting audit for:', url);

    // Launch browser with Vercel-compatible configuration
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('✅ Page loaded, running axe-core...');

    // Run axe accessibility audit
    const results = await new AxeBuilder({ page }).analyze();

    await browser.close();
    browser = null;

    console.log('✅ Audit complete');

    // Format results
    const formattedResults = {
      url,
      timestamp: new Date().toISOString(),
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary
        }))
      })),
      passes: results.passes.map(p => ({
        id: p.id,
        description: p.description,
        help: p.help
      })),
      incomplete: results.incomplete.map(i => ({
        id: i.id,
        description: i.description,
        help: i.help
      })),
      summary: {
        critical: results.violations.filter(v => v.impact === 'critical'),
        criticalCount: results.violations.filter(v => v.impact === 'critical').length,
        warningCount: results.violations.filter(v => v.impact === 'moderate' || v.impact === 'serious').length,
        passedCount: results.passes.length
      }
    };

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('❌ Audit error:', error);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({
      error: 'Failed to run accessibility audit',
      details: error.message
    });
  }
};

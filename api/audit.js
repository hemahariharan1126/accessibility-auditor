// Vercel Serverless Function for /api/audit
const { runFullAudit } = require('../src/auditor/mainAuditor');

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
};

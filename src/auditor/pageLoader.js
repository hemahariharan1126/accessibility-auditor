const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function loadPage(url) {
  console.log('🌐 Loading page (Optimized for Memory):', url);
  
  let browser;
  
  try {
    // 1. Memory and CPU Optimization: Remove unnecessary Chrome features/services
    const optimizedArgs = [
      ...chromium.args, 
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Recommended for limited memory environments
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Use a single process instead of multiple for a slight memory reduction
      '--disable-gpu' // Generally safe in serverless environments
    ];

    browser = await puppeteer.launch({
      args: optimizedArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    const page = await browser.newPage();

    // 2. Speed Optimization: Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        // Block images, media, and fonts to save memory and network time
        if (['image', 'media', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
    
    // 3. Shorter Timeouts: 25s might still be too long for serverless
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // Change to a faster wait condition
      timeout: 15000 // Reduced timeout to 15 seconds
    });
    
    console.log('✅ Page loaded successfully');
    
    return { page, browser };
  } catch (error) {
    if (browser) await browser.close();
    console.error('Failed to load page:', error);
    throw error;
  }
}

module.exports = { loadPage };

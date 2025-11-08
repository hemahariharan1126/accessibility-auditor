const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function loadPage(url) {
  console.log('🌐 Loading page:', url);
  
  let browser;
  
  try {
    // Launch browser with serverless-compatible settings
    browser = await puppeteer.launch({
      // 👇 Crucial Change: Spread chromium.args and explicitly add '--no-sandbox'
      args: [...chromium.args, '--no-sandbox'], 
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    // ... rest of the function ...
    const page = await browser.newPage();
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 25000  // Reduced timeout for serverless
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


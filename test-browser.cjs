const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  page.on('response', response => {
    console.log('RESPONSE:', response.status(), response.url());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // wait a bit more
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log('HTML LENGTH:', html.length);
  console.log('HTML SNIPPET:', html.substring(0, 500));
  
  const rootContent = await page.$eval('#root', el => el.innerHTML);
  console.log('ROOT CONTENT LENGTH:', rootContent.length);
  console.log('ROOT CONTENT:', rootContent.substring(0, 500));
  
  await browser.close();
})();

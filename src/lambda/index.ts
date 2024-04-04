import main from './RHI/main';
import puppeteer from 'puppeteer-core';
const chromium = require('@sparticuz/chromium-min');

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

exports.handler = async (event, context) => {

  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const inputs = event.body

  try {

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar',
      ),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://google.com");
    const pageTitle = await page.title();
    await browser.close();

    console.log(pageTitle);
    return pageTitle;

    await main(inputs, puppeteer, 1, {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  }
  catch (err) {
    console.log(err);
  }
}
import main from './RHI/main';
import puppeteer from 'puppeteer-core';
const chromium = require('@sparticuz/chromium-min');

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

exports.handler = async (event, context) => {

  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const inputs = JSON.parse(event.body);

  try {

    await main(inputs, puppeteer, 1, {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar',
      ),
      headless: chromium.headless,
    })

    return "Update Complete";

  }
  catch (err) {
    console.log(err);
  }
}
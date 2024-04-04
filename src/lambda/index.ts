import main from './RHI/main';
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

exports.handler = async (event, context) => {

  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const inputs = event.body

  try {
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
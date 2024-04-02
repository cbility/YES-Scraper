import main from './RHI/main';
import chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {

  const inputs = JSON.parse(event.body);
  let result = null;
  let browser = null;

  try {
    await main(inputs, chromium.puppeteer, 1, true)
  }
  catch (err) {
    console.log(err);
  }
}
import main from './RHI/main';
const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {

  console.log("here");

  const inputs = JSON.parse(event.body);

  try {
    await main(inputs, chromium.puppeteer, 1, true)
  }
  catch (err) {
    console.log(err);
  }
}
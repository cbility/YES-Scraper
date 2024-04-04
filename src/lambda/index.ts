import main from './RHI/main';
const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {

  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const inputs = event.body

  try {
    await main(inputs, chromium.puppeteer, 1, true)
  }
  catch (err) {
    console.log(err);
  }
}
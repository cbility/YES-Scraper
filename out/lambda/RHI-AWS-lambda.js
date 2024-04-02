/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */
/*
const chromium = require('chrome-aws-lambda');


exports.handler = async (event, context) => {

  let result = null;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();



    const buffer = await page.screenshot()
    result = await page.title()

    // upload the image using the current timestamp as filename
    const s3result = await s3
      .upload({
        Bucket: process.env.S3_BUCKET,
        Key: `${Date.now()}.png`,
        Body: buffer,
        ContentType: 'image/png',
        ACL: 'public-read'
      })
      .promise()

    console.log('S3 image URL:', s3result.Location)

    await page.close();
    await browser.close();

  } catch (error) {
    console.log(error)
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return result
}
*/ 
//# sourceMappingURL=RHI-AWS-lambda.js.map
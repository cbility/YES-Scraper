import puppeteer from 'puppeteer';
import getLoginDetails from './RHI/getLoginDetails';

async function main() {
    const loginID: string = process.argv[2];
    const browser = await puppeteer.launch({ headless: false });
    await getLoginDetails(loginID, browser);
    // Perform any other tasks here
    await browser.close();
}

main().catch(error => console.error(error));

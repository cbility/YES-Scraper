// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import puppeteer from "puppeteer";
import main from "./lambda/RHI/main";
import { PuppeteerNode as PuppeteerCoreNode } from "puppeteer-core";

import {
    loginsTable,
    ExistingRecord,
    LoginInput,
    getAllRecords,
} from "./lambda/globals";

const browserArgs = {
    headless: "new", //using new headless mode, set to false to disable headless
    defaultViewport: null,
    args: [
        "--autoplay-policy=user-gesture-required",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-dev-shm-usage",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-hang-monitor",
        "--disable-notifications",
        "--disable-offer-store-unmasked-wallet-cards",
        "--disable-popup-blocking",
        "--disable-print-preview",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-setuid-sandbox",
        "--disable-speech-api",
        "--disable-sync",
        "--hide-scrollbars",
        "--ignore-gpu-blacklist",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "--no-pings",
        "--no-sandbox",
        "--no-zygote",
        "--password-store=basic",
        "--use-gl=swiftshader",
        "--use-mock-keychain",
    ],
};

(async () => {
    // const allLoginRecords: ExistingRecord[] = await getAllRecords(loginsTable.id);

    // const inputs: LoginInput[] = allLoginRecords.map((record) => ({
    //     loginID: record.id,
    //}));


    await main([{ loginID: "65e37da7f8428f036fd9999a" }],
        puppeteer as unknown as PuppeteerCoreNode,
        browserArgs,
        1,
        true);
    return;
    /* */

    /*
    async function updateLogins(step: number, index: number = 0) {
        if (inputs.length - step > index) {
            console.log(`index ${index}`);
            await main(inputs.slice(index, index + step),
                puppeteer as unknown as PuppeteerCoreNode,
                browserArgs,
                1,
                true);
            updateLogins(step, index + step);
        } else {
            await main(inputs.slice(index), puppeteer as unknown as PuppeteerCoreNode, browserArgs, 1, true);
        }
    }

    updateLogins(50, 50);
    */
})();

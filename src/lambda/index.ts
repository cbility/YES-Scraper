import main from "./RHI/main";
import puppeteer from "puppeteer-core";
import chromium = require("@sparticuz/chromium-min");
import { Handler } from "aws-lambda";

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const handler: Handler = async (event) => {

    const shallow: boolean = Boolean(event.queryStringParameters?.shallow);

    console.log("EVENT: \n" + JSON.stringify(event, null, 2));

    const inputs = JSON.parse(event.body);

    try {

        await main(inputs, puppeteer, {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(
                "https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar",
            ),
            headless: chromium.headless,
        }, 1, shallow);

        const response = {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Update Complete" })
        };
        return response;

    }
    catch (err) {
        console.log(err);
    }
};

module.exports = {
    handler
};
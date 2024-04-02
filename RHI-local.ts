require('dotenv').config();
import puppeteer from 'puppeteer';
import main from './lambda/RHI/main';
import getRecord from './getRecord';
import {
    accountsTable, RHIsTable, loginsTable, getRecordsByFieldValues,
    ExistingRecord, LoginInput, AccountInput, RHIInput, getAllRecords
} from "./lambda/globals";

(async () => {

    const allLoginRecords: ExistingRecord[] = await getAllRecords(loginsTable.id);

    const inputs: LoginInput[] = allLoginRecords.map(record => ({ loginID: record.id }));

    //await main([{ loginID: "65e37da7f8428f036fd997d7" }], puppeteer, 1, true);
    //const testID: string = process.argv[2];

    async function updateLogins(step: number, index: number = 0) {
        if (inputs.length - step > index) {
            console.log(`index ${index}`);
            await main(inputs.slice(index, index + step), puppeteer, 1, true)
            updateLogins(step, index + step)
        } else {
            await main(inputs.slice(index), puppeteer, 1, true)
        }
    }

    updateLogins(50, 650);

})();



"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ukPostalCodePattern = void 0;
const globals_1 = require("../globals");
const globals_2 = require("../globals");
const cheerio = require("cheerio");
exports.ukPostalCodePattern = /\b(GIR 0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW])\s?[0-9][ABD-HJLNP-UW-Z]{2})\b/gi;
function getAccountDetails(accountRecord, page) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield page.goto('https://rhi.ofgem.gov.uk/UserManagement/ManageAccount.aspx');
        const viewAccountButton = yield page.$("#mainPlaceHolder_ContentPlaceHolder_UserAccountManage_btnEditAccount");
        yield viewAccountButton.click();
        yield page.waitForNavigation();
        const accountDetailsHTML = yield page.content();
        const $ = cheerio.load(accountDetailsHTML);
        accountRecord.title =
            $('#accordion-default-content-1 > dl > div.govuk-summary-list__row > dd.govuk-summary-list__value')
                .text().replace('\n', '').trim();
        accountRecord[globals_1.accountsTable.fields['Account Address']] = {};
        let addressData = Object.assign({}, (0, globals_2.extractPostcodeFromAddress)($('#accordion-default-content-2 > dl > div.govuk-summary-list__row > dd.govuk-summary-list__value')
            .text().trim()));
        // Assign the extracted values to the address object properties
        accountRecord[globals_1.accountsTable.fields['Account Address']].location_address =
            addressData.modifiedAddress;
        accountRecord[globals_1.accountsTable.fields['Account Address']].location_zip = (_a = addressData.postcode) === null || _a === void 0 ? void 0 : _a.trim();
        accountRecord[globals_1.accountsTable.fields['Account Address']].location_country = "UK";
        accountRecord[globals_1.accountsTable.fields['Company Phone']] =
            [formatPhoneNumber($('#accordion-default-content-3 > dl > div.govuk-summary-list__row > dd.govuk-summary-list__value')
                    .text().replace('\n', '').trim())
            ];
        accountRecord[globals_1.accountsTable.fields['Company Number']] =
            [$('#accordion-default-content-5 > dl > div.govuk-summary-list__row > dd.govuk-summary-list__value')
                    .text().replace('\n', '').trim()];
        accountRecord[globals_1.accountsTable.fields['AS Name']] = {};
        accountRecord[globals_1.accountsTable.fields['AS Name']].first_name =
            $('#accordion-default-content-6 > dl:nth-child(3) > div > dd.govuk-summary-list__value')
                .text().replace('\n', '').trim();
        accountRecord[globals_1.accountsTable.fields['AS Name']].middle_name =
            $('#accordion-default-content-6 > dl:nth-child(7) > div > dd.govuk-summary-list__value')
                .text().replace('\n', '').trim();
        accountRecord[globals_1.accountsTable.fields['AS Name']].last_name =
            $('#accordion-default-content-6 > dl:nth-child(5) > div > dd.govuk-summary-list__value')
                .text().replace('\n', '').trim();
        accountRecord[globals_1.accountsTable.fields['AS Email']] =
            [$('#accordion-default-content-6 > dl:nth-child(13) > div > dd.govuk-summary-list__value')
                    .text().replace('\n', '').trim()];
        accountRecord[globals_1.accountsTable.fields['AS Job Title']] =
            $('#accordion-default-content-6 > dl:nth-child(11) > div > dd.govuk-summary-list__value')
                .text().replace('\n', '').trim();
        accountRecord[globals_1.accountsTable.fields['Remittance Email']] =
            [$('#mainPlaceHolder_ContentPlaceHolder_UserAccountManage_liRemittanceEmailReadonly > dd.govuk-summary-list__value')
                    .text().replace('\n', '').trim()];
        return accountRecord;
    });
}
exports.default = getAccountDetails;
function formatPhoneNumber(phoneNumber) {
    if (phoneNumber.startsWith('+')) {
        // Phone number already has country code, return as is
        return phoneNumber;
    }
    if (phoneNumber.startsWith('0')) {
        // Remove leading 0 and assume the number is from the UK
        phoneNumber = phoneNumber.slice(1);
        return '+44' + phoneNumber;
    }
    // If no country code is provided and number doesn't start with 0, return with + at start
    return '+' + phoneNumber;
}
//# sourceMappingURL=getAccountDetails.js.map
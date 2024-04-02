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
exports.extractPostcodeFromAddress = exports.getAllRecords = exports.getRecordsByFieldValues = exports.HTTPError = exports.RHIsTable = exports.accountsTable = exports.loginsTable = exports.SMARTSUITE_HEADERS = void 0;
const getAccountDetails_1 = require("./RHI/getAccountDetails");
exports.SMARTSUITE_HEADERS = { "Authorization": process.env.SMARTSUITE_KEY, "Account-Id": "s5ch1upc" };
;
;
exports.loginsTable = {
    id: "65e37da7f8428f036fd99785", fields: {
        Username: 'title',
        'First Created': 'first_created',
        'Last Updated': 'last_updated',
        'Followed by': 'followed_by',
        'Open Comments': 'comments_count',
        'Auto Number': 'autonumber',
        Password: 'sb4e5173b6',
        'Record ID (System Field)': 's949848d7e',
        'Password Correct': 's300305bbd',
        '🔽Comments🔽': 'sf444dc534',
        'Login Type': 's362676897',
        Account: 's69317bdee',
        'RHI Record IDs (System Field)': 'sdf91c49ec'
    }
};
exports.accountsTable = {
    id: "64d155a9c71c81dc0b41d527", fields: {
        'Account Name': 'title',
        'First Created': 'first_created',
        'Last Updated': 'last_updated',
        'Followed by': 'followed_by',
        'Open Comments': 'comments_count',
        'Auto Number': 'autonumber',
        'ORG number': 's20a1cb3b6',
        Client: 'sbf79625b1',
        RHIs: 'skjrn9vl',
        'Additional Users': 's9b3c22274',
        'Record ID (System Field)': 'sa91f18b97',
        '🔽Comments🔽': 'sf444dc534',
        'Link to RHI Payments': 'suf1q9sl',
        'AS Username': 's200891b35',
        'AS Password': 's716517628',
        Logins: 'splq0phf',
        Count: 'sb7e3ff7d9',
        'Account Address': 's906ceac06',
        'Company Phone': 's898c7779e',
        'Company Number': 'sa82805803',
        'AS Name': 's5af20d21e',
        'AS Email': 's27463de03',
        'AS Job Title': 's94016b86e',
        'Remittance Email': 'se00b833bd'
    }
};
exports.RHIsTable = {
    id: "64d155a9c71c81dc0b41d52d", fields: {
        'RHI Number': 'title',
        'Submission Status': 'status',
        'First Created': 'first_created',
        'Last Updated': 'last_updated',
        'Followed by': 'followed_by',
        'Open Comments': 'comments_count',
        'Auto Number': 'autonumber',
        'Accreditation Date': 's2e1875a9c',
        'QHLF (kWh)': 's788a692be',
        'RHI Account': 's366a5e476',
        Tags: 'sed8818474',
        'Link to Fuel References': 'svtw43sc',
        'RHI Installation Name': 's8f22568aa',
        Technology: 's4285e945a',
        Installation: 'sj4xhegu',
        'Accreditation Status': 'sf81a2f775',
        'Correctly Formatted RHI number (System Field)': 's305f616e7',
        'Application Submitted': 'sb79716244',
        'Site Owner': 's0e7865f12',
        'Application Status': 'saktmxc5',
        'Update Data': 'sc402e67f5',
        'Thermal Capacity': 'sd1c8007fa',
        'Record ID (System Field)': 'sdada683b2',
        'Last Submitted': 's7a7a2ede6',
        '🔽Branch Comments🔽 (System Field)': 's9eacd797b',
        '🔼Branch Comments🔼 (System Field)': 's8e3e7b53c',
        'Link to RHI Submissions': 'swox1akz',
        '🔼Comments🔼': 's21374e2f1',
        '🔽Comments🔽': 's74450684c',
        'Document Review': 'sbc3cf68a7',
        'Link to Tasks': 's7uib8r9',
        'Name Plate Efficiency': 's4037fc899',
        'Sustainability Reporting': 's7a8a4d943',
        'Commissioning Date': 's594437604',
        'Number of boilers': 's030c8748d',
        'Boiler Manufacturer': 's42d018586',
        'Boiler Model': 's94038cbea',
        HH110: 'sa112061bc',
        HH120: 's21e98e9b5',
        'Hot Water Meters': 'sb249dfefd',
        'Steam Meters': 's76ea8502f',
        Location: 'sb5c903c06',
        HK120: 's49e310a4c',
        'Last Submission': 's3ea6ec8f7',
        'RHI Start': 's1179e8b96',
        'Quarter ends': 's418ae4140',
        'AS Username': 'sf8e7d9233',
        'AS Password': 'sb28891359'
    }
};
class HTTPError extends Error {
    constructor(status, statusText) {
        super(`HTTP Error: ${status} - ${statusText}`);
        this.name = 'HTTPError';
        this.status = status;
        this.statusText = statusText;
    }
}
exports.HTTPError = HTTPError;
function getRecordsByFieldValues(values, fieldSlug, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/list/`;
        let body = {
            "filter": {
                "operator": "or",
                "fields": values.map(value => ({
                    "field": fieldSlug,
                    "comparison": "is",
                    "value": value
                }))
            }
        };
        let response = yield fetch(url, {
            method: 'POST',
            headers: Object.assign(Object.assign({}, exports.SMARTSUITE_HEADERS), { 'Content-Type': 'application/json;charset=utf-8' }),
            body: JSON.stringify(body)
        });
        if (!response.ok)
            throw new HTTPError(response.status, response.statusText);
        let result = yield response.json();
        return result.items;
    });
}
exports.getRecordsByFieldValues = getRecordsByFieldValues;
function getAllRecords(tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/list/`;
        let body = {};
        let response = yield fetch(url, {
            method: 'POST',
            headers: Object.assign(Object.assign({}, exports.SMARTSUITE_HEADERS), { 'Content-Type': 'application/json;charset=utf-8' }),
            body: JSON.stringify(body)
        });
        if (!response.ok)
            throw new HTTPError(response.status, response.statusText);
        let result = yield response.json();
        return result.items;
    });
}
exports.getAllRecords = getAllRecords;
function extractPostcodeFromAddress(address) {
    let addressLines = address.split(',');
    let postcode;
    getAccountDetails_1.ukPostalCodePattern.lastIndex = 0;
    for (let i = addressLines.length - 1; i >= 0; i--) {
        if (getAccountDetails_1.ukPostalCodePattern.test(addressLines[i])) {
            postcode = addressLines[i];
            addressLines.splice(i, 1);
            break;
        }
    }
    return { modifiedAddress: addressLines.map(line => line === null || line === void 0 ? void 0 : line.trim()).join(', '), postcode };
}
exports.extractPostcodeFromAddress = extractPostcodeFromAddress;
//# sourceMappingURL=globals.js.map
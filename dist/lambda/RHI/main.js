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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
const globals_2 = require("../globals");
const globals_3 = require("../globals");
const globals_4 = require("../globals");
const globals_5 = require("../globals");
const getLoginDetails_1 = require("./getLoginDetails");
const getAccountDetails_1 = require("./getAccountDetails");
const logInUser_1 = require("./logInUser");
const validateLogin_1 = require("./validateLogin");
const getRHIDetails_1 = require("./getRHIDetails");
const MIN_LOGINS_PER_BROWSER = 3;
function main(inputs_1, puppeteer_1) {
    return __awaiter(this, arguments, void 0, function* (inputs, puppeteer, multiplicity = 1, browserArgs) {
        if (inputs.length === 0)
            throw new Error("Empty input array");
        if ("loginID" in inputs[0]) {
            //if triggered with login IDs to update
            //get login records from login table
            const loginRecordsList = yield (0, globals_3.getRecordsByFieldValues)(inputs.map((input) => input.loginID), globals_1.loginsTable.fields["Record ID (System Field)"], globals_1.loginsTable.id);
            const loginRecords = {};
            for (const loginRecord of loginRecordsList) {
                loginRecords[loginRecord.id] = loginRecord;
            }
            //get RHI Records from RHI Table
            const ExistingRHIRecords = {};
            const ExistingRHIAccounts = {};
            (yield (0, globals_5.getAllRecords)(globals_1.RHIsTable.id)).forEach((RHI) => {
                ExistingRHIRecords[RHI.title] = RHI.id;
                ExistingRHIAccounts[RHI.title] = RHI[globals_1.RHIsTable.fields["RHI Account"]];
            });
            // use multiplicity for number of browser unless there are too few logins
            const numBrowsers = loginRecordsList.length > multiplicity * MIN_LOGINS_PER_BROWSER
                ? multiplicity
                : Math.floor(loginRecordsList.length / MIN_LOGINS_PER_BROWSER) || 1;
            const browsers = new Array(numBrowsers).fill(yield puppeteer.launch(browserArgs));
            const loginsIDsForBrowsers = splitArrayIntoSubArrays(inputs, numBrowsers);
            const [{ logins: loginDetails, accounts: accountDetails, newRHIs: newRHIDetails, updatedRHIs: updatedRHIDetails, },] = (yield Promise.all(browsers.map(function (browser, index) {
                return __awaiter(this, void 0, void 0, function* () {
                    const loginIDs = loginsIDsForBrowsers[index].map((inputLogin) => inputLogin.loginID);
                    const _updatedLoginDetails = [];
                    const _updatedAccountDetails = [];
                    const _updatedRHIDetails = [];
                    const _newRHIDetails = [];
                    const page = yield browser.newPage();
                    for (const loginRecordID of loginIDs) {
                        const loginRecordToUpdate = loginRecords[loginRecordID];
                        // set the account via updating the account record, not the login record itself
                        const accountID = loginRecordToUpdate[globals_1.loginsTable.fields["Account"]][0];
                        //delete loginRecordToUpdate[loginsTable.fields['Account']];
                        if (!loginRecordToUpdate[globals_1.loginsTable.fields["Password Correct"]])
                            continue;
                        yield (0, logInUser_1.default)(loginRecordToUpdate, page);
                        if (!(yield (0, validateLogin_1.default)(page))) {
                            updateRecord({ [globals_1.loginsTable.fields["Password Correct"]]: false }, loginRecordID, globals_1.loginsTable.id);
                            console.log(`Log in failed for ${loginRecordToUpdate[globals_1.loginsTable.fields["Username"]]}`);
                            continue;
                        }
                        console.log(`Log in success for ${loginRecordToUpdate[globals_1.loginsTable.fields["Username"]]}`);
                        const updatedLoginRecord = yield (0, getLoginDetails_1.default)(loginRecordToUpdate, page);
                        // Account information not available on AU logins
                        if (updatedLoginRecord[globals_1.loginsTable.fields["Login Type"]] ===
                            "Additional User") {
                            const RHIDetails = yield (0, getRHIDetails_1.default)(accountID, page);
                            if (!RHIDetails[0])
                                continue;
                            updatedLoginRecord[globals_1.loginsTable.fields["Account"]] =
                                ExistingRHIAccounts[RHIDetails[0].title]; // Set account using linked RHIs
                            RHIDetails.forEach((RHI) => {
                                delete RHI[globals_1.RHIsTable.fields["RHI Account"]];
                                if (!(RHI.title in ExistingRHIRecords)) {
                                    return; //don't add RHIs that we don't have an AS password for
                                }
                                RHI.id = ExistingRHIRecords[RHI.title];
                                _updatedRHIDetails.push(RHI); //update everything but account
                            });
                            _updatedLoginDetails.push(updatedLoginRecord);
                            continue;
                        }
                        const accountRecordToUpdate = accountID
                            ? {
                                id: accountID,
                            }
                            : {
                                //only update the linked login if account is brand new, i.e. corresponds to a new AS login
                                id: undefined,
                                [globals_1.accountsTable.fields["Logins"]]: [loginRecordToUpdate.id],
                            };
                        /*AU logins have to be linked to existing accounts on SS. That's because the account details
                           aren't available from AU logins, so the account has to be identified via the RHIs.
                
                           That means that AU logins are added to an account via updating the login record, whereas AS
                           logins are only ever added to a brand new account record via creating a creating the
                           record with a link to the login. Accounts records are only ever updated from an AS login.
                
                           That in turn means that logins have to be updated BEFORE new accounts are created, and that
                           updating an account record can not update the linked logins.
                           This avoids overwriting information.*/
                        const updatedAccountRecord = yield (0, getAccountDetails_1.default)(accountRecordToUpdate, page);
                        if (accountID) {
                            //only get RHIs for accounts on record
                            const RHIDetails = yield (0, getRHIDetails_1.default)(accountID, page);
                            RHIDetails.forEach((RHI) => {
                                if (!(RHI.title in ExistingRHIRecords)) {
                                    _newRHIDetails.push(RHI);
                                    return;
                                }
                                RHI.id = ExistingRHIRecords[RHI.title];
                                _updatedRHIDetails.push(RHI);
                            });
                        }
                        _updatedLoginDetails.push(updatedLoginRecord);
                        _updatedAccountDetails.push(updatedAccountRecord);
                    }
                    yield browser.close();
                    console.log("browser closed");
                    return {
                        logins: _updatedLoginDetails,
                        accounts: _updatedAccountDetails,
                        updatedRHIs: _updatedRHIDetails,
                        newRHIs: _newRHIDetails,
                    };
                });
            })))
                .flat()
                .filter(Boolean);
            if (loginDetails.length == 0)
                return;
            const newAccountDetails = accountDetails
                .filter((account) => !account.id)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map((_a) => {
                var { id } = _a, rest = __rest(_a, ["id"]);
                return rest;
            });
            const updatedAccountDetails = accountDetails.filter((account) => Boolean(account.id));
            //update SmartSuite logins first to avoid overwriting links to new accounts
            if (loginDetails.length > 0)
                updateExistingRecords(loginDetails, globals_1.loginsTable.id);
            //add new accounts
            if (newAccountDetails.length > 0)
                yield addNewRecords(newAccountDetails, globals_1.accountsTable.id);
            //update existing accounts
            if (updatedAccountDetails.length > 0)
                yield updateExistingRecords(updatedAccountDetails, globals_1.accountsTable.id);
            //update existing RHIs
            if (updatedRHIDetails.length > 0)
                yield updateExistingRecords(updatedRHIDetails, globals_1.RHIsTable.id);
            //add new RHIs
            if (newRHIDetails.length > 0)
                yield addNewRecords(newRHIDetails, globals_1.RHIsTable.id);
            console.log("records updated");
        }
        else if ("accountID" in inputs[0]) {
            //do stuff with account
        }
        else if ("rhiID" in inputs[0]) {
            //do stuff with RHI
        }
    });
}
exports.default = main;
function splitArrayIntoSubArrays(array, numSubArrays) {
    const subArrays = new Array(numSubArrays).fill([]);
    const length = array.length;
    for (let i = 0; i < length; i++) {
        subArrays[i % numSubArrays].push(array[i]);
    }
    return subArrays;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRecordsByTitle(titles, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/list/`;
        const body = {
            filter: {
                operator: "or",
                fields: titles.map((title) => ({
                    field: "title",
                    comparison: "is",
                    value: title,
                })),
            },
        };
        const response = yield fetch(url, {
            method: "POST",
            headers: Object.assign(Object.assign({}, globals_4.SMARTSUITE_HEADERS), { "Content-Type": "application/json;charset=utf-8" }),
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw new globals_2.HTTPError(response.status, response.statusText);
        const result = yield response.json();
        return result.items;
    });
}
function addNewRecords(records, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;
        const body = { items: records };
        const response = yield fetch(url, {
            method: "POST",
            headers: Object.assign(Object.assign({}, globals_4.SMARTSUITE_HEADERS), { "Content-Type": "application/json;charset=utf-8" }),
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw new globals_2.HTTPError(response.status, response.statusText);
        const result = yield response.json();
        return result;
    });
}
function updateExistingRecords(records, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;
        const body = { items: records };
        const response = yield fetch(url, {
            method: "PATCH",
            headers: Object.assign(Object.assign({}, globals_4.SMARTSUITE_HEADERS), { "Content-Type": "application/json;charset=utf-8" }),
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw new globals_2.HTTPError(response.status, response.statusText);
        const result = yield response.json();
        return result;
    });
}
function updateRecord(record, recordID, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/${recordID}/`;
        const body = record;
        const response = yield fetch(url, {
            method: "PATCH",
            headers: Object.assign(Object.assign({}, globals_4.SMARTSUITE_HEADERS), { "Content-Type": "application/json;charset=utf-8" }),
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw new globals_2.HTTPError(response.status, response.statusText);
        const result = yield response.json();
        return result;
    });
}
//# sourceMappingURL=main.js.map
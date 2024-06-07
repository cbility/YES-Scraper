import {
    accountsTable,
    RHIsTable,
    loginsTable,
    LoginRecord,
    AccountRecord,
} from "../globals";
import { RHIRecord } from "../globals";
import { HTTPError } from "../globals";
import { getRecordsByFieldValues } from "../globals";
import { LoginInput, AccountInput, RHIInput } from "../globals";
import { ExistingRecord } from "../globals";
import { SMARTSUITE_HEADERS } from "../globals";
import { getAllRecords } from "../globals";
import getLoginDetails from "./getLoginDetails";
import getAccountDetails from "./getAccountDetails";
import logInUser from "./logInUser";
import validateLogin from "./validateLogin";
import getRHIDetails from "./getRHIDetails";
import { PuppeteerNode as PuppeteerCoreNode } from "puppeteer-core";

type Inputs = LoginInput[] | AccountInput[] | RHIInput[];

const MIN_LOGINS_PER_BROWSER = 3;

export default async function main(
    inputs: Inputs,
    puppeteer: PuppeteerCoreNode,
    browserArgs: object,
    multiplicity: number = 1,
    shallow: boolean = false
) {
    if (inputs.length === 0) throw new Error("Empty input array");

    if ("loginID" in inputs[0]) {
        //if triggered with login IDs to update

        //get login records from login table
        const loginRecordsList: ExistingRecord[] = await getRecordsByFieldValues(
            (inputs as LoginInput[]).map((input: LoginInput) => input.loginID),
            loginsTable.fields["Record ID (System Field)"],
            loginsTable.id
        );

        const loginRecords = {};
        for (const loginRecord of loginRecordsList) {
            loginRecords[loginRecord.id] = loginRecord as ExistingRecord;
        }

        //get RHI Records from RHI Table
        const ExistingRHIRecords = {};
        const ExistingRHIAccounts = {};
        (await getAllRecords(RHIsTable.id)).forEach((RHI) => {
            ExistingRHIRecords[RHI.title] = RHI.id;
            ExistingRHIAccounts[RHI.title] = RHI[RHIsTable.fields["RHI Account"]];
        });

        // use multiplicity for number of browser unless there are too few logins
        const numBrowsers =
            loginRecordsList.length > multiplicity * MIN_LOGINS_PER_BROWSER
                ? multiplicity
                : Math.floor(loginRecordsList.length / MIN_LOGINS_PER_BROWSER) || 1;

        const browsers = new Array(numBrowsers).fill(
            await puppeteer.launch(browserArgs)
        );
        const loginsIDsForBrowsers = splitArrayIntoSubArrays(inputs, numBrowsers);

        const [
            {
                logins: loginDetails,
                accounts: accountDetails,
                newRHIs: newRHIDetails,
                updatedRHIs: updatedRHIDetails,
            },
        ] = (
            await Promise.all(
                browsers.map(async function (browser, index) {
                    const loginIDs = loginsIDsForBrowsers[index].map(
                        (inputLogin: LoginInput) => inputLogin.loginID
                    );
                    const _updatedLoginDetails: LoginRecord[] = [];
                    const _updatedAccountDetails: (AccountRecord | Omit<AccountRecord, "id">)[] = [];
                    const _updatedRHIDetails: RHIRecord[] = [];
                    const _newRHIDetails: Omit<RHIRecord, "id">[] = [];
                    const page = await browser.newPage();

                    for (const loginRecordID of loginIDs) {
                        const loginRecordToUpdate: LoginRecord =
                            loginRecords[loginRecordID];
                        // set the account via updating the account record, not the login record itself
                        const accountID =
                            (loginRecordToUpdate[loginsTable.fields["Account"]] as string[])[0];
                        //delete loginRecordToUpdate[loginsTable.fields['Account']];

                        if (!loginRecordToUpdate[loginsTable.fields["Password Correct"]])
                            continue;

                        await logInUser(loginRecordToUpdate, page);

                        if (!(await validateLogin(page))) {
                            updateSingleRecord(
                                { [loginsTable.fields["Password Correct"]]: false },
                                loginRecordID,
                                loginsTable.id
                            );
                            console.log(
                                `Log in failed for ${loginRecordToUpdate[loginsTable.fields["Username"]]
                                }`
                            );
                            continue;
                        }
                        console.log(
                            `Log in success for ${loginRecordToUpdate[loginsTable.fields["Username"]]
                            }`
                        );

                        const updatedLoginRecord: LoginRecord = await getLoginDetails(
                            loginRecordToUpdate,
                            page
                        );

                        // Account information not available on AU logins
                        if (
                            updatedLoginRecord[loginsTable.fields["Login Type"]] ===
                            "Additional User"
                        ) {
                            const RHIDetails = await getRHIDetails(accountID, page, shallow);
                            if (!RHIDetails[0]) continue;

                            updatedLoginRecord[loginsTable.fields["Account"]] =
                                ExistingRHIAccounts[
                                RHIDetails[0].title as string
                                ]; // Set account using linked RHIs

                            RHIDetails.forEach((RHI) => {
                                delete RHI[RHIsTable.fields["RHI Account"]];

                                if (!(RHI.title as string in ExistingRHIRecords)) {
                                    return; //don't add RHIs that we don't have an AS password for
                                }
                                RHI.id = ExistingRHIRecords[RHI.title as string];
                                _updatedRHIDetails.push(RHI); //update everything but account
                            });

                            _updatedLoginDetails.push(updatedLoginRecord);
                            continue;
                        }

                        const accountRecordToUpdate: AccountRecord | Omit<AccountRecord, "id"> = accountID ?
                            { id: accountID, } : {
                                //only update the linked login if account is brand new,
                                // i.e. corresponds to a new AS login
                                id: undefined,
                                [accountsTable.fields["Logins"]]: [loginRecordToUpdate.id],
                            };
                        /*AU logins have to be linked to pre-existing accounts on SS. That's because the account details
                           aren't available from AU logins, so the account has to be identified via the RHIs.
                
                           That means that AU logins are added to an account via updating the login record, whereas AS
                           logins are only ever added to a brand new account record via creating the record with
                           a link to the login. Accounts records are only ever updated from an AS login.
                
                           That in turn means that logins have to be updated BEFORE new accounts are created, and that 
                           updating an account record can not update the linked logins.
                           This avoids overwriting information.*/

                        const updatedAccountRecord: Omit<AccountRecord, "id"> = await getAccountDetails(
                            accountRecordToUpdate,
                            page
                        );

                        if (accountID) {
                            //only get RHIs for accounts on record
                            const RHIDetails = await getRHIDetails(accountID, page, shallow);
                            RHIDetails.forEach((RHI) => {
                                if (!(RHI.title as string in ExistingRHIRecords)) {
                                    _newRHIDetails.push(RHI);
                                    return;
                                }
                                RHI.id = ExistingRHIRecords[RHI.title as string];
                                _updatedRHIDetails.push(RHI);
                            });
                        }
                        _updatedLoginDetails.push(updatedLoginRecord);
                        _updatedAccountDetails.push(updatedAccountRecord);
                    }
                    await browser.close();
                    console.log("browser closed");
                    return {
                        logins: _updatedLoginDetails,
                        accounts: _updatedAccountDetails,
                        updatedRHIs: _updatedRHIDetails,
                        newRHIs: _newRHIDetails,
                    };
                })
            )
        )
            .flat()
            .filter(Boolean);

        if (loginDetails.length == 0) return;

        const newAccountDetails: Omit<AccountRecord, "id">[] = accountDetails
            .filter((account) => !account.id)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ id, ...rest }) => rest);

        const updatedAccountDetails: AccountRecord[] = accountDetails.filter(
            (account) => !!account.id
        ) as AccountRecord[];

        //update SmartSuite logins first to avoid overwriting links to new accounts
        if (loginDetails.length > 0)
            updateMultipleRecords(loginDetails, loginsTable.id);

        //add new accounts
        if (newAccountDetails.length > 0)
            await addNewRecords(newAccountDetails, accountsTable.id);

        //update existing accounts
        if (updatedAccountDetails.length > 0)
            await updateMultipleRecords(updatedAccountDetails, accountsTable.id);

        //update existing RHIs
        if (updatedRHIDetails.length > 0)
            await updateMultipleRecords(updatedRHIDetails, RHIsTable.id);

        //add new RHIs
        if (newRHIDetails.length > 0)
            await addNewRecords(newRHIDetails, RHIsTable.id);

        console.log("records updated");
    } else if ("accountID" in inputs[0]) {
        //do stuff with account
    } else if ("rhiID" in inputs[0]) {
        //do stuff with RHI
    }

}

function splitArrayIntoSubArrays(array: unknown[], numSubArrays: number) {
    const subArrays = new Array(numSubArrays).fill([]);
    const length = array.length;
    for (let i = 0; i < length; i++) {
        subArrays[i % numSubArrays].push(array[i]);
    }
    return subArrays;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getRecordsByTitle(titles: string[], tableID: string) {
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

    const response = await fetch(url, {
        method: "POST",
        headers: {
            ...SMARTSUITE_HEADERS,
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    const result = await response.json();
    return result.items;
}

async function addNewRecords(records: object[], tableID: string) {
    const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;

    const body = { items: records };
    const response = await fetch(url, {
        method: "POST",
        headers: {
            ...SMARTSUITE_HEADERS,
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    const result = await response.json();
    return result;
}

async function updateMultipleRecords(
    records: ExistingRecord[],
    tableID: string
) {
    const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;

    const body = { items: records };
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            ...SMARTSUITE_HEADERS,
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    const result = await response.json();
    return result;
}

async function updateSingleRecord(record: object, recordID: string, tableID: string) {
    const url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/${recordID}/`;

    const body = record;
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            ...SMARTSUITE_HEADERS,
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    const result = await response.json();
    return result;
}

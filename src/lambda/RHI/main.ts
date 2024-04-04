import { accountsTable, RHIsTable, loginsTable, LoginRecord, AccountRecord } from "../globals";
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


type Inputs = LoginInput[] | AccountInput[] | RHIInput[];

const MIN_LOGINS_PER_BROWSER = 3;

export default async function main(inputs: Inputs, puppeteer, multiplicity: number = 1, browserArgs) { //headless: boolean = true) {

    if (inputs.length === 0) throw new Error("Empty input array");

    if ('loginID' in inputs[0]) { //if triggered with login IDs to update

        //get login records from login table
        const loginRecordsList: ExistingRecord[] = await getRecordsByFieldValues(
            (inputs as LoginInput[]).map((input: LoginInput) => input.loginID),
            loginsTable.fields['Record ID (System Field)'],
            loginsTable.id);

        let loginRecords = {};
        for (let loginRecord of loginRecordsList) {
            loginRecords[loginRecord.id] = loginRecord as ExistingRecord;
        }

        //get RHI Records from RHI Table
        const ExistingRHIRecords = {};
        (await getAllRecords(RHIsTable.id)).forEach(RHI => {
            ExistingRHIRecords[RHI.title] = RHI.id;
        })

        // use multiplicity for number of browser unless there are too few logins
        const numBrowsers = (
            loginRecordsList.length > multiplicity * MIN_LOGINS_PER_BROWSER
        ) ?
            multiplicity :
            Math.floor(loginRecordsList.length / MIN_LOGINS_PER_BROWSER) || 1;

        const browsers = new Array(numBrowsers).fill(await puppeteer.launch(browserArgs));
        const loginsIDsForBrowsers = splitArrayIntoSubArrays(inputs, numBrowsers);

        const [{ logins: loginDetails, accounts: accountDetails,
            newRHIs: newRHIDetails, updatedRHIs: updatedRHIDetails }] = (await Promise.all(browsers.map(
                async function (browser, index) {

                    const loginIDs = loginsIDsForBrowsers[index].map((inputLogin: LoginInput) => inputLogin.loginID);
                    let _updatedLoginDetails: LoginRecord[] = [];
                    let _updatedAccountDetails: AccountRecord[] = [];
                    let _updatedRHIDetails: RHIRecord[] = [];
                    let _newRHIDetails: Omit<RHIRecord, "id">[] = [];
                    const page = await browser.newPage();

                    for (let loginRecordID of loginIDs) {

                        const loginRecordToUpdate: LoginRecord = loginRecords[loginRecordID];
                        // set the account via updating the account record, not the login record itself
                        const accountID = loginRecordToUpdate[loginsTable.fields['Account']][0];
                        //delete loginRecordToUpdate[loginsTable.fields['Account']];

                        if (!loginRecordToUpdate[loginsTable.fields['Password Correct']]) continue;

                        await logInUser(loginRecordToUpdate, page);

                        if (!(await validateLogin(page))) {
                            updateRecord({ [loginsTable.fields["Password Correct"]]: false }, loginRecordID, loginsTable.id);
                            console.log(`Log in failed for ${loginRecordToUpdate[loginsTable.fields["Username"]]}`);
                            continue;
                        }
                        console.log(`Log in success for ${loginRecordToUpdate[loginsTable.fields["Username"]]}`);

                        const updatedLoginRecord: LoginRecord = await getLoginDetails(loginRecordToUpdate, page);

                        // Account information not available on AU logins
                        if (updatedLoginRecord[loginsTable.fields["Login Type"]] === "Additional User") {
                            _updatedLoginDetails.push(updatedLoginRecord);
                            continue; // will be updated later to get account using the linked RHIs
                        }

                        const accountRecordToUpdate: AccountRecord = accountID ? {
                            id: accountID,
                        } : { //only update the linked login if account is brand new, i.e. corresponds to a new AS login
                            id: undefined,
                            [accountsTable.fields['Logins']]: [loginRecordToUpdate.id]
                        };
                        /*AU logins have to be linked to existing accounts on SS. That's because the account details
                         aren't available from AU logins, so the account has to be identified via the RHIs.
    
                        That means that AU logins are added to an account via updating the login record, whereas AS
                        logins are only ever added to a brand new account record via creating a creating the
                        record with a link to the login. Accounts records are only ever updated from an AS login.
    
                        That in turn means that logins have to be updated BEFORE new accounts are created, and that 
                        updating an account record can not update the linked logins.
                        This avoids overwriting information.*/

                        const updatedAccountRecord: AccountRecord = await getAccountDetails(accountRecordToUpdate, page);

                        if (accountID) { //only get RHIs for accounts on record
                            const RHIDetails = await getRHIDetails(accountID, page);
                            RHIDetails.forEach(
                                RHI => {
                                    if (!(RHI.title in ExistingRHIRecords)) {
                                        _newRHIDetails.push(RHI);
                                        return;
                                    }
                                    RHI.id = ExistingRHIRecords[RHI.title];
                                    _updatedRHIDetails.push(RHI);
                                })
                        }
                        _updatedLoginDetails.push(updatedLoginRecord);
                        _updatedAccountDetails.push(updatedAccountRecord);
                    }
                    await browser.close()
                    console.log("browser closed");
                    return {
                        logins: _updatedLoginDetails, accounts: _updatedAccountDetails,
                        updatedRHIs: _updatedRHIDetails, newRHIs: _newRHIDetails
                    };
                }))).flat().filter(Boolean);


        if (loginDetails.length == 0) return;

        type NewAccountRecord = Omit<AccountRecord, 'id'>;

        const newAccountDetails: NewAccountRecord[] = accountDetails
            .filter(account => !Boolean(account.id))
            .map(({ id, ...rest }) => rest);

        const updatedAccountDetails: AccountRecord[] = accountDetails
            .filter(account => Boolean(account.id));

        //update SmartSuite logins first to avoid overwriting links to new accounts
        if (loginDetails.length > 0) updateExistingRecords(loginDetails, loginsTable.id);

        //add new accounts
        if (newAccountDetails.length > 0) await addNewRecords(newAccountDetails, accountsTable.id);

        //update existing accounts
        if (updatedAccountDetails.length > 0) await updateExistingRecords(updatedAccountDetails, accountsTable.id);

        //update existing RHIs
        if (updatedRHIDetails.length > 0) await updateExistingRecords(updatedRHIDetails, RHIsTable.id);

        //add new RHIs
        if (newRHIDetails.length > 0) await addNewRecords(newRHIDetails, RHIsTable.id);

        console.log("records updated");



    } else if ('accountID' in inputs[0]) {
        //do stuff with account
    } else if ('rhiID' in inputs[0]) {
        //do stuff with RHI
    }

    for (let input of inputs) {

    }

}

function splitArrayIntoSubArrays(array: any[], numSubArrays: number) {
    const subArrays = new Array(numSubArrays).fill([]);
    const length = array.length;
    for (let i = 0; i < length; i++) {
        subArrays[i % numSubArrays].push(array[i]);
    }
    return subArrays;
}

async function getRecordsByTitle(titles: string[], tableID: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/list/`;

    let body = {
        "filter": {
            "operator": "or",
            "fields": titles.map(title => ({
                "field": "title",
                "comparison": "is",
                "value": title
            }))
        }
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    let result = await response.json();
    return result.items;
}

async function addNewRecords(records: object[], tableID: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;

    let body = { "items": records };
    let response = await fetch(url, {
        method: 'POST',
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    let result = await response.json();
    return result;
}

async function updateExistingRecords(records: ExistingRecord[], tableID: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/bulk/`;

    let body = { "items": records };
    let response = await fetch(url, {
        method: 'PATCH',
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    let result = await response.json();
    return result;
}

async function updateRecord(record: object, recordID: string, tableID: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/${recordID}/`;

    let body = record;
    let response = await fetch(url, {
        method: 'PATCH',
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    let result = await response.json();
    return result;
}

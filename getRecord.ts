import { HTTPError } from "./lambda/globals";
import { SMARTSUITE_HEADERS } from "./lambda/globals";

//getRecord(process.argv[2], process.argv[3]).then(console.log);

export default async function getRecord(recordID: string, tableID: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/${recordID}/`;

    let response = await fetch(url, {
        method: 'GET',
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' }
    });

    if (!response.ok) throw new HTTPError(response.status, response.statusText);

    let result = await response.json();
    return result;
}
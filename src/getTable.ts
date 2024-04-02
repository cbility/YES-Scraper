require('dotenv').config();
import { SMARTSUITE_HEADERS } from "./lambda/globals";

getTable(process.argv[2]).then(result => {
    let structure = {};
    result.structure.forEach(field => {
        structure[field.label] = field.slug;
    });
    return structure;
}).then(console.log);


async function getTable(id: string) {
    let url = `https://app.smartsuite.com/api/v1/applications/${id}/`;
    console.log(SMARTSUITE_HEADERS);
    let response = await fetch(url, {
        headers: { ...SMARTSUITE_HEADERS, 'Content-Type': 'application/json;charset=utf-8' }
    });
    let result = await response.json();
    return result;
}

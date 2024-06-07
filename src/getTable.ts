// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import { SMARTSUITE_HEADERS } from "./lambda/globals";

getTable(process.argv[2]).then(result => {
    const structure: Record<string, string> = {};
    result.structure.forEach((field: { label: string; slug: string; }) => {
        structure[field.label] = field.slug;
    });
    return structure;
}).then(console.log);


async function getTable(id: string) {
    const url = `https://app.smartsuite.com/api/v1/applications/${id}/`;
    console.log(SMARTSUITE_HEADERS);
    const response = await fetch(url, {
        headers: { ...SMARTSUITE_HEADERS, "Content-Type": "application/json;charset=utf-8" }
    });
    const result = await response.json();
    return result;
}

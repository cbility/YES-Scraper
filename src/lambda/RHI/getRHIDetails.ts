import { RHIRecord, RHIsTable } from "../globals";
import { AddressFieldType } from "../globals";
import {Page} from "puppeteer-core";
import * as cheerio from "cheerio";
import PostcodesIO = require("postcodesio-client");
const postcodes = new PostcodesIO("https://api.postcodes.io");

export default async function getRHIDetails(
    accountID: string,
    page: Page
): Promise<RHIRecord[]> {
    
    //go to accreditation
    await page.goto("https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13");

    const RHIRecords: RHIRecord[] = [];

    //get accreditation information and push to RHIRecords
    const accreditationSummaryHTML = await page.content();
    const summary$ = cheerio.load(accreditationSummaryHTML);
    const numRows = summary$(
        "#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > tbody > tr").length - 1;

    for (let tableRow = 2; tableRow <= numRows + 1; tableRow++) {
        const RHI: RHIRecord = await getRHIAccreditationDetails(tableRow, accountID, page, summary$);
        RHIRecords.push(RHI);
        await page.goto("https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13");
    }
    //go to periodic data
    await page.goto("https://rhi.ofgem.gov.uk/PeriodicData/SubmitPeriodicData.aspx");

    const RHIOptions = await page.evaluate(() => {
        const selectElement: HTMLSelectElement = document.querySelector(
            "#FullWidthPlaceholder_FullWidthContentPlaceholder_ddlInstallation");
        const _options: {[key: string]: string} = {};
        Array.from(selectElement.options)
            .forEach(option => {_options[option.textContent.trim()] = option.value;});
        return _options;
    });  

    //get periodic data information and update RHIRecords
    for (const RHI of RHIRecords) {
        if (RHI[RHIsTable.fields["Accreditation Status"]] == "Terminated" 
              || RHI[RHIsTable.fields["Accreditation Status"]] == "Withdrawn") continue;

        await page.select("#FullWidthPlaceholder_FullWidthContentPlaceholder_ddlInstallation",
            RHIOptions[RHI.title + " | " + RHI[RHIsTable.fields["RHI Installation Name"]]]);

        await page.waitForNavigation();

        const PeriodicDataSubmissionHTML = await page.content();
        const {firstDate, lastDate} = getSubmissionDates(PeriodicDataSubmissionHTML);
        RHI[RHIsTable.fields["Latest Submitted PDS"]] = lastDate?.toISOString().split("T")[0];
        RHI[RHIsTable.fields["RHI Start"]] = firstDate?.toISOString().split("T")[0];
        await page.goto("https://rhi.ofgem.gov.uk/PeriodicData/SubmitPeriodicData.aspx");
    }
    return RHIRecords;
}

async function getRHIAccreditationDetails(
    tableRow: number, accountID: string, page: Page, summary$: cheerio.CheerioAPI) {

    const RHI: RHIRecord = {
        id: undefined,
        [RHIsTable.fields["RHI Account"]]: [accountID],
        "sb5c903c06": undefined
    };

    getBasicAccreditationDetail(RHI, tableRow, summary$);

    const viewDetailsButton = await page.$(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList_btnViewAccredApp_${tableRow - 2}`);

    await Promise.all([
        page.waitForNavigation(),
        viewDetailsButton.click()
    ]);

    const accreditationDetailsHTML = await page.content();

    getExpandedAccreditationDetail(accreditationDetailsHTML, RHI);

    await getPostcodeLocation(RHI);
    return RHI;
}

async function getPostcodeLocation(RHI: RHIRecord) {
    const postcode = RHI[RHIsTable.fields["Location"]]?.location_zip;
    if (postcode) {
        const postcodeData = await postcodes.lookup(postcode);
        if (postcodeData) {
            RHI[RHIsTable.fields["Location"]].location_latitude = String(postcodeData.latitude);
            RHI[RHIsTable.fields["Location"]].location_longitude = String(postcodeData.longitude);
        }
    }
}

function getExpandedAccreditationDetail(accreditationDetailsHTML: string, RHI: RHIRecord) {
    const $ = cheerio.load(accreditationDetailsHTML);

    const accreditationSummaryTableRows = $(
        "#mainPlaceHolder_ContentPlaceHolder_gvAccredAppQuestionsAndAnswers > tbody > tr");

    accreditationSummaryTableRows.each((index, element) => {
        const rowID = $(element).find("td:nth-child(1)");

        switch (rowID.text().trim()) {
        case "HC110": {
            RHI[RHIsTable.fields["Commissioning Date"]] = convertToISODateString(
                $(element).find("td:nth-child(3)").text());
            break;
        }
        case "HA120": {
            RHI[RHIsTable.fields["Thermal Capacity"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HH120": {
            RHI[RHIsTable.fields["HH120"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HA110": {
            RHI[RHIsTable.fields["Technology"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HH123-3": {
            RHI[RHIsTable.fields["QHLF (KWH)"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HA150": {
            RHI[RHIsTable.fields["Name Plate Efficiency"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HA160": {
            RHI[RHIsTable.fields["Sustainability Reporting"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HG122a-1": {
            RHI[RHIsTable.fields["Boiler Manufacturer"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HG123a-1": {
            RHI[RHIsTable.fields["Boiler Model"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HH110": {
            RHI[RHIsTable.fields["HH110"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HG121": {
            RHI[RHIsTable.fields["Number of boilers"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HI100-1": {
            RHI[RHIsTable.fields["Hot Water Meters"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HI100-2": {
            RHI[RHIsTable.fields["Steam Meters"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HK120": {
            RHI[RHIsTable.fields["HK120"]] = $(element).find("td:nth-child(3)").text();
            break;
        }
        case "HC130": {
            const address: AddressFieldType = { "location_country": "United Kingdom" };
            switch ($(element).find("td:nth-child(3)").text()) { //is account address same as install address
            case "Yes": {
                accreditationSummaryTableRows.each((i, e) => {
                    const rID = $(e).find("td:nth-child(1)");
                    switch (rID.text().trim()) {
                    case "HM130": {
                        address.location_address = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HM140": {
                        address.location_address2 = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HM160": {
                        address.location_city = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HM170": {
                        address.location_state = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HM180": {
                        address.location_zip = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    }
                });
                break;
            }
            case "No": {
                accreditationSummaryTableRows.each((i, e) => {
                    const rID = $(e).find("td:nth-child(1)");
                    switch (rID.text().trim()) {
                    case "HC150": {
                        address.location_address = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HC160": {
                        address.location_address2 = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HC180": {
                        address.location_city = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HC190": {
                        address.location_state = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    case "HC140": {
                        address.location_zip = $(e).find("td:nth-child(3)").text();
                        break;
                    }
                    }
                });
                break;
            }
            }
            RHI[RHIsTable.fields["Location"]] = address;
            break;
        }
        }
    });
}

function getBasicAccreditationDetail(RHI: RHIRecord, tableRow: number, $: cheerio.CheerioAPI) {
    RHI.title = $(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > 
            tbody > tr:nth-child(${tableRow}) > td:nth-child(2)`)
        .text().trim();
    RHI[RHIsTable.fields["RHI Installation Name"]] = $(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
             tbody > tr:nth-child(${tableRow}) > td:nth-child(3)`)
        .text().trim();
    //RHI[RHIsTable.fields['Application Submitted']] = {};
    RHI[RHIsTable.fields["Application Submitted"]] = convertToISODateString($(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(4)`)
        .text().trim());
    //RHI[RHIsTable.fields['Accreditation date']] = {};
    RHI[RHIsTable.fields["Accreditation date"]] = convertToISODateString($(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(5)`)
        .text().trim());
    RHI[RHIsTable.fields["Application Status"]] = $(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(6)`)
        .text().trim();
    RHI[RHIsTable.fields["Accreditation Status"]] = $(
        `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(7)`)
        .text().trim();
}

function convertToISODateString(dateString: string) {
    if (dateString.trim() === "") return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) {
        throw new Error("Invalid date format");
    }
    // Rearrange the parts to form the "YYYY-MM-DD" format
    const isoDateString = parts[2] + "-" + parts[1] + "-" + parts[0];
    return isoDateString;
}

function getSubmissionDates(PeriodicDateSubmissionHTML: string): {firstDate: Date; lastDate: Date} {
    const $ = cheerio.load(PeriodicDateSubmissionHTML);
    const PDSRows = $("#FullWidthPlaceholder_FullWidthContentPlaceholder_gvTimeLines > tbody > tr");

    const firstDate: Date =  PDSRows.length > 0 ? getDayBeforeFirstDateInLine(PDSRows[PDSRows.length-1]): null;
    let lastDate: Date = null;

    PDSRows.each((index, PDSRow) => { 
        const status = $(PDSRow).find("td:nth-child(2)").text().trim();
        const action = $(PDSRow).find("td:nth-child(3)").text().trim();
        switch (status) {
        case "Submitted" :
        case "Approved" :
        case "In Review" :
            lastDate = getSecondDateInLine(PDSRow);
            return false; //exit loop
        case "Partially Complete" :
            switch (action) {
            case "Record/Submit":
                // eslint-disable-next-line no-case-declarations
                lastDate = getDayBeforeFirstDateInLine(PDSRow);
                return false; //exit loop
            case "View" :
                lastDate = getSecondDateInLine(PDSRow);
                return false; //exit loop
            }
            break;
        case "Partially Complete but With Participant" :
            if (action === "Edit") {
                lastDate = getDayBeforeFirstDateInLine(PDSRow);
                return false; //exit loop
            }
            break;
        }
    });
    return {firstDate, lastDate};

    function getSecondDateInLine(PDSRow: cheerio.Element): Date {
        const dateRegex = /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/g;
        return new Date(Date.parse($(PDSRow).find("td:nth-child(1)").text().match(dateRegex)[1]));
    }

    function getDayBeforeFirstDateInLine(PDSRow: cheerio.Element): Date {
        const dateRegex = /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/g;
        const date = new Date(Date.parse($(PDSRow).find("td:nth-child(1)").text().match(dateRegex)[0]));
        return new Date(date.setDate(date.getDate() - 1));
    }
}


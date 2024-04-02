import { RHIRecord, RHIsTable } from "../globals";
import { extractPostcodeFromAddress } from "../globals";
import { AddressFieldType } from "../globals";

import * as cheerio from 'cheerio';
let PostcodesIO = require('postcodesio-client');
let postcodes = new PostcodesIO('https://api.postcodes.io');

export default async function getRHIDetails(accountID: string, page: any): Promise<RHIRecord[]> {
    //go to accreditation

    await Promise.all(
        [page.goto('https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13'),
        ] //page.waitForNavigation({ waitUntil: 'networkidle0' })]
    );
    const RHIRecords: RHIRecord[] = []

    const accreditationSummaryHTML = await page.content();

    const summary$ = cheerio.load(accreditationSummaryHTML);

    const numRows = summary$(
        "#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > tbody > tr").length - 1;

    for (let tableRow = 2; tableRow <= numRows + 1; tableRow++) {
        const RHI: RHIRecord = { id: undefined, [RHIsTable.fields['RHI Account']]: [accountID] };

        RHI.title = summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > 
            tbody > tr:nth-child(${tableRow}) > td:nth-child(2)`)
            .text().trim();
        RHI[RHIsTable.fields['RHI Installation Name']] = summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
             tbody > tr:nth-child(${tableRow}) > td:nth-child(3)`)
            .text().trim();
        //RHI[RHIsTable.fields['Application Submitted']] = {};
        RHI[RHIsTable.fields['Application Submitted']] = convertToISODateString(summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(4)`)
            .text().trim());
        //RHI[RHIsTable.fields['Accreditation date']] = {};
        RHI[RHIsTable.fields['Accreditation date']] = convertToISODateString(summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(5)`)
            .text().trim());
        RHI[RHIsTable.fields['Application Status']] = summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(6)`)
            .text().trim();
        RHI[RHIsTable.fields['Accreditation Status']] = summary$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(7)`)
            .text().trim();

        const viewDetailsButton = await page.$(
            `#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList_btnViewAccredApp_${tableRow - 2}`)

        await Promise.all([
            page.waitForNavigation(),
            viewDetailsButton.click()]);

        //await page.waitForNavigation();
        const accreditationDetailsHTML = await page.content();
        const $ = cheerio.load(accreditationDetailsHTML);

        const tableRows = $('#mainPlaceHolder_ContentPlaceHolder_gvAccredAppQuestionsAndAnswers > tbody > tr');

        tableRows.each((index, element) => {
            const rowID = $(element).find('td:nth-child(1)');

            switch (rowID.text().trim()) {
                case 'HC110': {
                    RHI[RHIsTable.fields['Commissioning Date']] = convertToISODateString(
                        $(element).find("td:nth-child(3)").text());
                    break;
                }
                case 'HA120': {
                    RHI[RHIsTable.fields['Thermal Capacity']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HH120': {
                    RHI[RHIsTable.fields['HH120']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HA110': {
                    RHI[RHIsTable.fields['Technology']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HH123-3': {
                    RHI[RHIsTable.fields['QHLF (KWH)']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HA150': {
                    RHI[RHIsTable.fields['Name Plate Efficiency']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HA160': {
                    RHI[RHIsTable.fields['Sustainability Reporting']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HG122a-1': {
                    RHI[RHIsTable.fields['Boiler Manufacturer']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HG123a-1': {
                    RHI[RHIsTable.fields['Boiler Model']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HH110': {
                    RHI[RHIsTable.fields['HH110']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HG121': {
                    RHI[RHIsTable.fields['Number of boilers']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HI100-1': {
                    RHI[RHIsTable.fields['Hot Water Meters']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HI100-2': {
                    RHI[RHIsTable.fields['Steam Meters']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HK120': {
                    RHI[RHIsTable.fields['HK120']] = $(element).find("td:nth-child(3)").text();
                    break;
                }
                case 'HC130': {
                    let address: AddressFieldType = { "location_country": "United Kingdom" };
                    switch ($(element).find("td:nth-child(3)").text()) { //is account address same as install address
                        case 'Yes': {
                            tableRows.each((i, e) => {
                                const rID = $(e).find('td:nth-child(1)');
                                switch (rID.text().trim()) {
                                    case 'HM130': {
                                        address.location_address = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HM140': {
                                        address.location_address2 = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HM160': {
                                        address.location_city = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HM170': {
                                        address.location_state = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HM180': {
                                        address.location_zip = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                }
                            });
                            break;
                        }
                        case 'No': {
                            tableRows.each((i, e) => {
                                const rID = $(e).find('td:nth-child(1)');
                                switch (rID.text().trim()) {
                                    case 'HC150': {
                                        address.location_address = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HC160': {
                                        address.location_address2 = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HC180': {
                                        address.location_city = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HC190': {
                                        address.location_state = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                    case 'HC140': {
                                        address.location_zip = $(e).find("td:nth-child(3)").text();
                                        break;
                                    }
                                }
                            });
                            break;
                        }
                    }
                    RHI[RHIsTable.fields['Location']] = address;
                    break;
                }
            }
        })
        const postcode = RHI[RHIsTable.fields['Location']]?.location_zip;
        if (postcode) {
            const postcodeData = await postcodes.lookup(postcode)
            if (postcodeData) {
                RHI[RHIsTable.fields['Location']].location_latitude = String(postcodeData.latitude);
                RHI[RHIsTable.fields['Location']].location_longitude = String(postcodeData.longitude);
            }
        }
        RHIRecords.push(RHI);
        await page.goto('https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13');
    }
    return RHIRecords;
}


function convertToISODateString(dateString) {
    if (dateString.trim() === '') return null;
    var parts = dateString.split('/');
    if (parts.length !== 3) {
        throw new Error('Invalid date format');
    }
    // Rearrange the parts to form the "YYYY-MM-DD" format
    var isoDateString = parts[2] + '-' + parts[1] + '-' + parts[0];
    return isoDateString;
}
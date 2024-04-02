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
const globals_1 = require("../globals");
const cheerio = require("cheerio");
let PostcodesIO = require('postcodesio-client');
let postcodes = new PostcodesIO('https://api.postcodes.io');
function getRHIDetails(accountID, page) {
    return __awaiter(this, void 0, void 0, function* () {
        //go to accreditation
        var _a;
        yield Promise.all([page.goto('https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13'),
        ] //page.waitForNavigation({ waitUntil: 'networkidle0' })]
        );
        const RHIRecords = [];
        const accreditationSummaryHTML = yield page.content();
        const summary$ = cheerio.load(accreditationSummaryHTML);
        const numRows = summary$("#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > tbody > tr").length - 1;
        for (let tableRow = 2; tableRow <= numRows + 1; tableRow++) {
            const RHI = { id: undefined, [globals_1.RHIsTable.fields['RHI Account']]: [accountID] };
            RHI.title = summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > 
            tbody > tr:nth-child(${tableRow}) > td:nth-child(2)`)
                .text().trim();
            RHI[globals_1.RHIsTable.fields['RHI Installation Name']] = summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
             tbody > tr:nth-child(${tableRow}) > td:nth-child(3)`)
                .text().trim();
            //RHI[RHIsTable.fields['Application Submitted']] = {};
            RHI[globals_1.RHIsTable.fields['Application Submitted']] = convertToISODateString(summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(4)`)
                .text().trim());
            //RHI[RHIsTable.fields['Accreditation date']] = {};
            RHI[globals_1.RHIsTable.fields['Accreditation date']] = convertToISODateString(summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(5)`)
                .text().trim());
            RHI[globals_1.RHIsTable.fields['Application Status']] = summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(6)`)
                .text().trim();
            RHI[globals_1.RHIsTable.fields['Accreditation Status']] = summary$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(7)`)
                .text().trim();
            const viewDetailsButton = yield page.$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList_btnViewAccredApp_${tableRow - 2}`);
            yield Promise.all([
                page.waitForNavigation(),
                viewDetailsButton.click()
            ]);
            //await page.waitForNavigation();
            const accreditationDetailsHTML = yield page.content();
            const $ = cheerio.load(accreditationDetailsHTML);
            const tableRows = $('#mainPlaceHolder_ContentPlaceHolder_gvAccredAppQuestionsAndAnswers > tbody > tr');
            tableRows.each((index, element) => {
                const rowID = $(element).find('td:nth-child(1)');
                switch (rowID.text().trim()) {
                    case 'HC110': {
                        RHI[globals_1.RHIsTable.fields['Commissioning Date']] = convertToISODateString($(element).find("td:nth-child(3)").text());
                        break;
                    }
                    case 'HA120': {
                        RHI[globals_1.RHIsTable.fields['Thermal Capacity']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HH120': {
                        RHI[globals_1.RHIsTable.fields['HH120']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HA110': {
                        RHI[globals_1.RHIsTable.fields['Technology']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HH123-3': {
                        RHI[globals_1.RHIsTable.fields['QHLF (KWH)']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HA150': {
                        RHI[globals_1.RHIsTable.fields['Name Plate Efficiency']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HA160': {
                        RHI[globals_1.RHIsTable.fields['Sustainability Reporting']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HG122a-1': {
                        RHI[globals_1.RHIsTable.fields['Boiler Manufacturer']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HG123a-1': {
                        RHI[globals_1.RHIsTable.fields['Boiler Model']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HH110': {
                        RHI[globals_1.RHIsTable.fields['HH110']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HG121': {
                        RHI[globals_1.RHIsTable.fields['Number of boilers']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HI100-1': {
                        RHI[globals_1.RHIsTable.fields['Hot Water Meters']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HI100-2': {
                        RHI[globals_1.RHIsTable.fields['Steam Meters']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HK120': {
                        RHI[globals_1.RHIsTable.fields['HK120']] = $(element).find("td:nth-child(3)").text();
                        break;
                    }
                    case 'HC130': {
                        let address = { "location_country": "United Kingdom" };
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
                        RHI[globals_1.RHIsTable.fields['Location']] = address;
                        break;
                    }
                }
            });
            const postcode = (_a = RHI[globals_1.RHIsTable.fields['Location']]) === null || _a === void 0 ? void 0 : _a.location_zip;
            if (postcode) {
                const postcodeData = yield postcodes.lookup(postcode);
                if (postcodeData) {
                    RHI[globals_1.RHIsTable.fields['Location']].location_latitude = String(postcodeData.latitude);
                    RHI[globals_1.RHIsTable.fields['Location']].location_longitude = String(postcodeData.longitude);
                }
            }
            RHIRecords.push(RHI);
            yield page.goto('https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13');
        }
        return RHIRecords;
    });
}
exports.default = getRHIDetails;
function convertToISODateString(dateString) {
    if (dateString.trim() === '')
        return null;
    var parts = dateString.split('/');
    if (parts.length !== 3) {
        throw new Error('Invalid date format');
    }
    // Rearrange the parts to form the "YYYY-MM-DD" format
    var isoDateString = parts[2] + '-' + parts[1] + '-' + parts[0];
    return isoDateString;
}
//# sourceMappingURL=getRHIDetails.js.map
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
const PostcodesIO = require("postcodesio-client");
const postcodes = new PostcodesIO("https://api.postcodes.io");
function getRHIDetails(accountID_1, page_1) {
    return __awaiter(this, arguments, void 0, function* (accountID, page, shallow = false) {
        //go to accreditation
        yield page.goto("https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13");
        const RHIRecords = [];
        //get accreditation information and push to RHIRecords
        const accreditationSummaryHTML = yield page.content();
        const summary$ = cheerio.load(accreditationSummaryHTML);
        const numRows = summary$("#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > tbody > tr").length - 1;
        for (let tableRow = 2; tableRow <= numRows + 1; tableRow++) {
            const RHI = yield getRHIAccreditationDetails(tableRow, accountID, page, summary$, shallow);
            RHIRecords.push(RHI);
            yield page.goto("https://rhi.ofgem.gov.uk/Accreditation/ApplyAccreditation.aspx?mode=13");
        }
        //go to periodic data
        yield page.goto("https://rhi.ofgem.gov.uk/PeriodicData/SubmitPeriodicData.aspx");
        const RHIOptions = yield page.evaluate(() => {
            const selectElement = document.querySelector("#FullWidthPlaceholder_FullWidthContentPlaceholder_ddlInstallation");
            const _options = {};
            Array.from(selectElement.options)
                .forEach(option => { _options[option.textContent.trim()] = option.value; });
            return _options;
        });
        //get periodic data information and update RHIRecords
        for (const RHI of RHIRecords) {
            if (RHI[globals_1.RHIsTable.fields["Accreditation Status"]] == "Terminated"
                || RHI[globals_1.RHIsTable.fields["Accreditation Status"]] == "Withdrawn")
                continue;
            yield page.select("#FullWidthPlaceholder_FullWidthContentPlaceholder_ddlInstallation", RHIOptions[RHI.title + " | " + RHI[globals_1.RHIsTable.fields["RHI Installation Name"]]]);
            yield page.waitForNavigation();
            const PeriodicDataSubmissionHTML = yield page.content();
            const { firstDate, lastDate } = getSubmissionDates(PeriodicDataSubmissionHTML);
            RHI[globals_1.RHIsTable.fields["Latest Submitted PDS"]] = lastDate === null || lastDate === void 0 ? void 0 : lastDate.toISOString().split("T")[0];
            RHI[globals_1.RHIsTable.fields["RHI Start"]] = firstDate === null || firstDate === void 0 ? void 0 : firstDate.toISOString().split("T")[0];
            yield page.goto("https://rhi.ofgem.gov.uk/PeriodicData/SubmitPeriodicData.aspx");
        }
        return RHIRecords;
    });
}
exports.default = getRHIDetails;
function getRHIAccreditationDetails(tableRow_1, accountID_1, page_1, summary$_1) {
    return __awaiter(this, arguments, void 0, function* (tableRow, accountID, page, summary$, shallow = false) {
        const RHI = {
            id: undefined,
            [globals_1.RHIsTable.fields["RHI Account"]]: [accountID],
            "sb5c903c06": undefined
        };
        getBasicAccreditationDetail(RHI, tableRow, summary$);
        if (!shallow) {
            const viewDetailsButton = yield page.$(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList_btnViewAccredApp_${tableRow - 2}`);
            yield Promise.all([
                page.waitForNavigation(),
                viewDetailsButton.click()
            ]);
            const accreditationDetailsHTML = yield page.content();
            getExpandedAccreditationDetail(accreditationDetailsHTML, RHI);
            yield getPostcodeLocation(RHI);
        }
        return RHI;
    });
}
function getPostcodeLocation(RHI) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const postcode = (_a = RHI[globals_1.RHIsTable.fields["Location"]]) === null || _a === void 0 ? void 0 : _a.location_zip;
        if (postcode) {
            const postcodeData = yield postcodes.lookup(postcode);
            if (postcodeData) {
                RHI[globals_1.RHIsTable.fields["Location"]].location_latitude = String(postcodeData.latitude);
                RHI[globals_1.RHIsTable.fields["Location"]].location_longitude = String(postcodeData.longitude);
            }
        }
    });
}
function getExpandedAccreditationDetail(accreditationDetailsHTML, RHI) {
    const $ = cheerio.load(accreditationDetailsHTML);
    const accreditationSummaryTableRows = $("#mainPlaceHolder_ContentPlaceHolder_gvAccredAppQuestionsAndAnswers > tbody > tr");
    accreditationSummaryTableRows.each((index, element) => {
        const rowID = $(element).find("td:nth-child(1)");
        switch (rowID.text().trim()) {
            case "HC110": {
                RHI[globals_1.RHIsTable.fields["Commissioning Date"]] = convertToISODateString($(element).find("td:nth-child(3)").text());
                break;
            }
            case "HA120": {
                RHI[globals_1.RHIsTable.fields["Thermal Capacity"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HH120": {
                RHI[globals_1.RHIsTable.fields["HH120"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HA110": {
                RHI[globals_1.RHIsTable.fields["Technology"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HH123-3": {
                RHI[globals_1.RHIsTable.fields["QHLF (KWH)"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HA150": {
                RHI[globals_1.RHIsTable.fields["Name Plate Efficiency"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HA160": {
                RHI[globals_1.RHIsTable.fields["Sustainability Reporting"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HG122a-1": {
                RHI[globals_1.RHIsTable.fields["Boiler Manufacturer"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HG123a-1": {
                RHI[globals_1.RHIsTable.fields["Boiler Model"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HH110": {
                RHI[globals_1.RHIsTable.fields["HH110"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HG121": {
                RHI[globals_1.RHIsTable.fields["Number of boilers"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HI100-1": {
                RHI[globals_1.RHIsTable.fields["Hot Water Meters"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HI100-2": {
                RHI[globals_1.RHIsTable.fields["Steam Meters"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HK120": {
                RHI[globals_1.RHIsTable.fields["HK120"]] = $(element).find("td:nth-child(3)").text();
                break;
            }
            case "HC130": {
                const address = { "location_country": "United Kingdom" };
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
                RHI[globals_1.RHIsTable.fields["Location"]] = address;
                break;
            }
        }
    });
}
function getBasicAccreditationDetail(RHI, tableRow, $) {
    RHI.title = $(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList > 
            tbody > tr:nth-child(${tableRow}) > td:nth-child(2)`)
        .text().trim();
    RHI[globals_1.RHIsTable.fields["RHI Installation Name"]] = $(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
             tbody > tr:nth-child(${tableRow}) > td:nth-child(3)`)
        .text().trim();
    //RHI[RHIsTable.fields['Application Submitted']] = {};
    RHI[globals_1.RHIsTable.fields["Application Submitted"]] = convertToISODateString($(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(4)`)
        .text().trim());
    //RHI[RHIsTable.fields['Accreditation date']] = {};
    RHI[globals_1.RHIsTable.fields["Accreditation date"]] = convertToISODateString($(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(5)`)
        .text().trim());
    RHI[globals_1.RHIsTable.fields["Application Status"]] = $(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                 tbody > tr:nth-child(${tableRow}) > td:nth-child(6)`)
        .text().trim();
    RHI[globals_1.RHIsTable.fields["Accreditation Status"]] = $(`#mainPlaceHolder_ContentPlaceHolder_gvEditOrViewAccredAppList >
                     tbody > tr:nth-child(${tableRow}) > td:nth-child(7)`)
        .text().trim();
}
function convertToISODateString(dateString) {
    if (dateString.trim() === "")
        return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) {
        throw new Error("Invalid date format");
    }
    // Rearrange the parts to form the "YYYY-MM-DD" format
    const isoDateString = parts[2] + "-" + parts[1] + "-" + parts[0];
    return isoDateString;
}
function getSubmissionDates(PeriodicDateSubmissionHTML) {
    const $ = cheerio.load(PeriodicDateSubmissionHTML);
    const PDSRows = $("#FullWidthPlaceholder_FullWidthContentPlaceholder_gvTimeLines > tbody > tr");
    const firstDate = PDSRows.length > 0 ? getDayBeforeFirstDateInLine(PDSRows[PDSRows.length - 1]) : null;
    let lastDate = null;
    PDSRows.each((index, PDSRow) => {
        const status = $(PDSRow).find("td:nth-child(2)").text().trim();
        const action = $(PDSRow).find("td:nth-child(3)").text().trim();
        switch (status) {
            case "Submitted":
            case "Approved":
            case "In Review":
                lastDate = getSecondDateInLine(PDSRow);
                return false; //exit loop
            case "Partially Complete":
                switch (action) {
                    case "Record/Submit":
                        // eslint-disable-next-line no-case-declarations
                        lastDate = getDayBeforeFirstDateInLine(PDSRow);
                        return false; //exit loop
                    case "View":
                        lastDate = getSecondDateInLine(PDSRow);
                        return false; //exit loop
                }
                break;
            case "Partially Complete but With Participant":
                if (action === "Edit") {
                    lastDate = getDayBeforeFirstDateInLine(PDSRow);
                    return false; //exit loop
                }
                break;
        }
    });
    return { firstDate, lastDate };
    function getSecondDateInLine(PDSRow) {
        const dateRegex = /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/g;
        return new Date(Date.parse($(PDSRow).find("td:nth-child(1)").text().match(dateRegex)[1]));
    }
    function getDayBeforeFirstDateInLine(PDSRow) {
        const dateRegex = /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/g;
        const date = new Date(Date.parse($(PDSRow).find("td:nth-child(1)").text().match(dateRegex)[0]));
        return new Date(date.setDate(date.getDate() - 1));
    }
}
//# sourceMappingURL=getRHIDetails.js.map
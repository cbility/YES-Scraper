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
const globals_1 = require("../lambda/globals");
const globals_2 = require("../lambda/globals");
//getRecord(process.argv[2], process.argv[3]).then(console.log);
function getRecord(recordID, tableID) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://app.smartsuite.com/api/v1/applications/${tableID}/records/${recordID}/`;
        let response = yield fetch(url, {
            method: 'GET',
            headers: Object.assign(Object.assign({}, globals_2.SMARTSUITE_HEADERS), { 'Content-Type': 'application/json;charset=utf-8' })
        });
        if (!response.ok)
            throw new globals_1.HTTPError(response.status, response.statusText);
        let result = yield response.json();
        return result;
    });
}
exports.default = getRecord;
//# sourceMappingURL=getRecord.js.map
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
require('dotenv').config();
const globals_1 = require("./lambda/globals");
getTable(process.argv[2]).then(result => {
    let structure = {};
    result.structure.forEach(field => {
        structure[field.label] = field.slug;
    });
    return structure;
}).then(console.log);
function getTable(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://app.smartsuite.com/api/v1/applications/${id}/`;
        console.log(globals_1.SMARTSUITE_HEADERS);
        let response = yield fetch(url, {
            headers: Object.assign(Object.assign({}, globals_1.SMARTSUITE_HEADERS), { 'Content-Type': 'application/json;charset=utf-8' })
        });
        let result = yield response.json();
        return result;
    });
}
//# sourceMappingURL=getTable.js.map
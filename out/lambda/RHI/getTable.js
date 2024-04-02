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
const main_1 = require("./main");
const RHI_local = require("../../out/RHI-local.js");
let woohoo = RHI_local;
console.log(woohoo);
getTable(process.argv[2]).then(console.log);
function getTable(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://app.smartsuite.com/api/v1/applications/${id}/`;
        console.log(main_1.headers);
        let response = yield fetch(url, {
            headers: Object.assign(Object.assign({}, main_1.headers), { 'Content-Type': 'application/json;charset=utf-8' })
        });
        let result = yield response.json();
        return result;
    });
}
//# sourceMappingURL=getTable.js.map
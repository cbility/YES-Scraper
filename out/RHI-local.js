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
const puppeteer_1 = require("puppeteer");
const main_1 = require("./lambda/RHI/main");
const globals_1 = require("./lambda/globals");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const allLoginRecords = yield (0, globals_1.getAllRecords)(globals_1.loginsTable.id);
    const inputs = allLoginRecords.map(record => ({ loginID: record.id }));
    //await main([{ loginID: "65e37da7f8428f036fd997d7" }], puppeteer, 1, true);
    //const testID: string = process.argv[2];
    function updateLogins(step_1) {
        return __awaiter(this, arguments, void 0, function* (step, index = 0) {
            if (inputs.length - step > index) {
                console.log(`index ${index}`);
                yield (0, main_1.default)(inputs.slice(index, index + step), puppeteer_1.default, 1, true);
                updateLogins(step, index + step);
            }
            else {
                yield (0, main_1.default)(inputs.slice(index), puppeteer_1.default, 1, true);
            }
        });
    }
    updateLogins(50, 650);
}))();
//# sourceMappingURL=RHI-local.js.map
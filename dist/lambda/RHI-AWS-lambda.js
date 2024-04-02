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
const main_1 = require("./RHI/main");
const chromium = require("chrome-aws-lambda");
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const inputs = JSON.parse(event.body);
    let result = null;
    let browser = null;
    try {
        yield (0, main_1.default)(inputs, chromium.puppeteer, 1, true);
    }
    catch (err) {
        console.log(err);
    }
});
//# sourceMappingURL=RHI-AWS-lambda.js.map
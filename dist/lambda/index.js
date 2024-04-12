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
const puppeteer_core_1 = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const shallow = Boolean((_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.shallow);
    console.log("EVENT: \n" + JSON.stringify(event, null, 2));
    const inputs = JSON.parse(event.body);
    try {
        yield (0, main_1.default)(inputs, puppeteer_core_1.default, {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: yield chromium.executablePath("https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar"),
            headless: chromium.headless,
        }, 1, false);
        const response = {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Update Complete", shallow })
        };
        return response;
    }
    catch (err) {
        console.log(err);
    }
});
//# sourceMappingURL=index.js.map
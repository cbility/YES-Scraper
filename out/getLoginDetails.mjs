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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
function getLoginDetails(loginID, browser) {
    return __awaiter(this, void 0, void 0, function () {
        var page, searchResultSelector, textSelector, fullTitle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    // Navigate the page to a URL
                    return [4 /*yield*/, page.goto('https://rhi.ofgem.gov.uk')];
                case 2:
                    // Navigate the page to a URL
                    _a.sent();
                    // Set screen size
                    return [4 /*yield*/, page.setViewport({ width: 1080, height: 1024 })];
                case 3:
                    // Set screen size
                    _a.sent();
                    // Type into search box
                    return [4 /*yield*/, page.type('.devsite-search-field', 'automate beyond recorder')];
                case 4:
                    // Type into search box
                    _a.sent();
                    searchResultSelector = '.devsite-result-item-link';
                    return [4 /*yield*/, page.waitForSelector(searchResultSelector)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.click(searchResultSelector)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector('text/Customize and automate')];
                case 7:
                    textSelector = _a.sent();
                    return [4 /*yield*/, (textSelector === null || textSelector === void 0 ? void 0 : textSelector.evaluate(function (el) { return el.textContent; }))];
                case 8:
                    fullTitle = _a.sent();
                    // Print the full title
                    console.log('The title of this blog post is "%s".', fullTitle);
                    return [4 /*yield*/, browser.close()];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = getLoginDetails;
//# sourceMappingURL=getLoginDetails.mjs.map
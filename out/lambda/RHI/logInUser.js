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
function logInUser(loginRecord, page) {
    return __awaiter(this, void 0, void 0, function* () {
        const username = loginRecord[globals_1.loginsTable.fields.Username];
        const password = loginRecord[globals_1.loginsTable.fields.Password];
        yield page.goto('https://rhi.ofgem.gov.uk/');
        const usernameField = yield page.$('#SecondaryPlaceHolder_RightColumnContentPlaceHolder_txtUserName');
        yield usernameField.type(username);
        const passwordField = yield page.$('#SecondaryPlaceHolder_RightColumnContentPlaceHolder_txtPassword');
        yield passwordField.type(password);
        const logInButton = yield page.$('#SecondaryPlaceHolder_RightColumnContentPlaceHolder_btnContinue');
        yield logInButton.click();
        yield page.waitForNavigation();
    });
}
exports.default = logInUser;
//# sourceMappingURL=logInUser.js.map
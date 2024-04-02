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
function getLoginDetails(loginRecord, page) {
    return __awaiter(this, void 0, void 0, function* () {
        const updatePasswordLink = yield page.$("#SecondaryPlaceHolder_rptLeftNavigation_hlnkLeftNav_2");
        //account is AS if option to update password is available
        if (updatePasswordLink) {
            loginRecord[globals_1.loginsTable.fields['Login Type']] = 'Authorised Signatory';
        }
        else {
            loginRecord[globals_1.loginsTable.fields['Login Type']] = 'Additional User';
            return loginRecord; //account name not available on AU logins
        }
        return loginRecord;
    });
}
exports.default = getLoginDetails;
//# sourceMappingURL=getLoginDetails.js.map
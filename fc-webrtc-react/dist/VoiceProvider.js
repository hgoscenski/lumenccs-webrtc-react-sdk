var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, createContext, useContext, useRef, useState } from 'react';
export var VoiceContext = createContext(null);
export var VoiceProvider = function (_a) {
    var value = _a.value, children = _a.children;
    useEffect(function () {
        return function () {
            if (!value.isStopped()) {
                value.stop();
            }
        };
    }, [value]);
    return _jsx(VoiceContext.Provider, { value: value, children: children });
};
export var useVoiceClient = function () {
    var context = useContext(VoiceContext);
    if (context === null) {
        throw new Error("useVoiceClient must be used within a VoiceProvider");
    }
    return context;
};
export var useCallAudioRef = function () {
    var ref = useRef(null);
    var voiceClient = useVoiceClient();
    useEffect(function () {
        if (ref.current !== null) {
            voiceClient.attachAudioElement(ref.current);
        }
        else {
            throw new AudioElementNotProvidedError();
        }
    }, []);
    return ref;
};
var AudioElementNotProvidedError = /** @class */ (function (_super) {
    __extends(AudioElementNotProvidedError, _super);
    function AudioElementNotProvidedError() {
        return _super.call(this, "Audio Element not found") || this;
    }
    return AudioElementNotProvidedError;
}(Error));
export { AudioElementNotProvidedError };
var CallFailedError = /** @class */ (function (_super) {
    __extends(CallFailedError, _super);
    function CallFailedError(message, details) {
        var _this = _super.call(this, "Call Failed: ".concat(message)) || this;
        _this.details = details;
        return _this;
    }
    return CallFailedError;
}(Error));
export { CallFailedError };
export var useCall = function () {
    var voiceClient = useVoiceClient();
    var _a = useState({
        callState: "PENDING",
    }), state = _a[0], setState = _a[1];
    useEffect(function () {
        var handleCallRinging = function () {
            return setState({ callState: "RINGING" });
        };
        var handleCallConnected = function () {
            return setState({ callState: "IN_PROGRESS" });
        };
        var handleCallEnded = function () {
            return setState({ callState: "ENDED" });
        };
        var handleVoiceError = function (event) {
            var _a;
            var errorMessage = event.cause;
            var details = (_a = event.message) === null || _a === void 0 ? void 0 : _a.data;
            var error = new CallFailedError(errorMessage, details);
            setState({ error: error, callState: "ENDED" });
        };
        voiceClient.on('callRinging', handleCallRinging);
        voiceClient.on('callconnected', handleCallConnected);
        voiceClient.on('hangup', handleCallEnded);
        voiceClient.on('callFailed', handleVoiceError);
        return function () {
            voiceClient.removeListener('callRinging', handleCallRinging);
            voiceClient.removeListener('callconnected', handleCallConnected);
            voiceClient.removeListener('hangup', handleCallEnded);
            voiceClient.removeListener('callFailed', handleVoiceError);
        };
    }, [voiceClient, setState]);
    var call = useCallback(function (to, jwt) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    voiceClient.setAuth(jwt);
                    if (!voiceClient.isStopped()) return [3 /*break*/, 2];
                    return [4 /*yield*/, voiceClient.start()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    voiceClient.call(to);
                    return [2 /*return*/];
            }
        });
    }); }, [voiceClient]);
    var hangup = useCallback(function () {
        voiceClient.hangup();
    }, [voiceClient]);
    var sendDTMF = useCallback(function (digit) {
        voiceClient.sendDTMF(digit);
    }, [voiceClient]);
    return {
        voiceClient: voiceClient,
        call: call,
        hangup: hangup,
        sendDTMF: sendDTMF,
        callState: state.callState,
        error: state.error
    };
};

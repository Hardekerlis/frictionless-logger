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
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.globalLoggerOptions = void 0;
var colors_1 = __importDefault(require("colors"));
var get_caller_file_1 = __importDefault(require("get-caller-file"));
var luxon_1 = require("luxon");
var colorsEnum_1 = require("./enums/colorsEnum");
var loggerLevels_1 = require("./enums/loggerLevels");
var fileStream_1 = require("./fileStream");
var deepmerge_1 = __importDefault(require("deepmerge"));
var emailTransport;
exports.globalLoggerOptions = {
    silent: false,
    showSourceFile: colorsEnum_1.ColorsEnum.BrightGreen,
    colors: true,
    message: {
        level: {
            silly: {
                color: colorsEnum_1.ColorsEnum.BrightWhite,
            },
            debug: {
                color: colorsEnum_1.ColorsEnum.Green,
            },
            verbose: {
                color: colorsEnum_1.ColorsEnum.Magenta,
            },
            http: {
                color: colorsEnum_1.ColorsEnum.Green,
            },
            info: {
                color: colorsEnum_1.ColorsEnum.Blue,
            },
            warn: {
                color: colorsEnum_1.ColorsEnum.Yellow,
            },
            error: {
                color: colorsEnum_1.ColorsEnum.Red,
            },
        },
        timestamp: true,
        color: colorsEnum_1.ColorsEnum.White,
    },
};
var Logger = /** @class */ (function () {
    function Logger(options, updateGlobalOptions) {
        colors_1.default.enable();
        if (options) {
            if (options.notify) {
                if (options.notify.transport) {
                    if (!emailTransport) {
                        this.emailTransport = options.notify.transport;
                    }
                    else {
                        this.emailTransport = emailTransport;
                    }
                    if (updateGlobalOptions) {
                        emailTransport = this.emailTransport;
                    }
                    // @ts-ignore
                    delete options.notify.transport;
                }
            }
        }
        if (options) {
            this.options = (0, deepmerge_1.default)(exports.globalLoggerOptions, options);
            if (updateGlobalOptions) {
                exports.globalLoggerOptions = this.options;
            }
        }
        else {
            this.options = exports.globalLoggerOptions;
        }
        if (this.options.file)
            this.fileStream = new fileStream_1.FileStream(this.options.file);
    }
    Logger.prototype.determineColor = function (color) {
        return color ? color : colorsEnum_1.ColorsEnum.White;
    };
    Logger.prototype.parseExtras = function (caller, disableColors) {
        var options = this.options;
        var extras = '';
        if (options) {
            if (options.message) {
                if (options.message.static) {
                    if (options.message.static.text) {
                        extras += "[".concat(this.colorText(options.message.static.text, this.determineColor(options.message.static.color), disableColors), "]");
                    }
                }
            }
            if (options.showSourceFile) {
                var splitPath = caller.split('/');
                var fileName = splitPath[splitPath.length - 1];
                extras += "[".concat(this.colorText(fileName, this.determineColor(options.showSourceFile), disableColors), "]");
            }
        }
        return extras;
    };
    Logger.prototype.colorText = function (text, color, disableColors) {
        if (this.options.colors === true && !disableColors) {
            // @ts-ignore
            return colors_1.default[color](text);
        }
        else {
            return text;
        }
    };
    Logger.prototype.getDate = function (disable) {
        if (this.options.message.timestamp) {
            var dt = luxon_1.DateTime.now();
            var date = dt
                .setLocale('SE')
                .toLocaleString(luxon_1.DateTime.TIME_24_WITH_SECONDS);
            if (!disable) {
                return "[".concat(this.colorText(date, colorsEnum_1.ColorsEnum.BrightBlue), "]");
            }
            else {
                return "[".concat(date, "]");
            }
            // @ts-ignore
        }
        else
            return '';
    };
    Logger.prototype.print = function (msg, level, caller) {
        return __awaiter(this, void 0, void 0, function () {
            var color;
            return __generator(this, function (_a) {
                color = this.options.message.level[level].color;
                // @ts-ignore
                process.stdout.write("".concat(this.getDate(), "[").concat(this.colorText(level.toUpperCase(), color), "]").concat(this.parseExtras(caller), ": ").concat(msg, "\n"));
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.printLogFile = function (msg, level, caller) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                if (this.fileStream) {
                    text = "".concat(this.getDate(true), "[").concat(level.toUpperCase(), "]").concat(this.parseExtras(caller, true), ": ").concat(msg, "\n");
                    this.fileStream.write(text);
                }
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.shouldPrint = function (level) {
        return (!this.options.silent ||
            (typeof this.options.silent === 'object' &&
                !this.options.silent.includes(level)));
    };
    Logger.prototype.notify = function (msg, level, caller) {
        if (this.options.notify) {
            var emailOpts = this.options.notify;
            var recipiants = '';
            for (var _i = 0, _a = emailOpts.recipiants; _i < _a.length; _i++) {
                var recipiant = _a[_i];
                if (recipiants === '') {
                    recipiants += recipiant;
                }
                else {
                    recipiants += ", ".concat(recipiant);
                }
            }
            var text = "".concat(this.getDate(true), "[").concat(level.toUpperCase(), "]").concat(this.parseExtras(caller, true), ": ").concat(msg, "\n");
            if (!this.emailTransport) {
                throw new Error('Email transport is not defined');
            }
            this.emailTransport.sendMail({
                from: emailOpts.sender,
                to: recipiants,
                subject: "Logger notification ".concat(emailOpts.applicationName, ": ").concat(level.toUpperCase()),
                text: text,
            });
        }
    };
    Logger.prototype.silly = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Silly) ||
            (options && options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Silly, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Silly, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Silly, caller);
    };
    Logger.prototype.debug = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Debug) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Debug, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Debug, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Debug, caller);
    };
    Logger.prototype.verbose = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Verbose) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Verbose, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Verbose, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Verbose, caller);
    };
    Logger.prototype.info = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Info) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Info, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Info, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Info, caller);
    };
    Logger.prototype.http = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Http) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Http, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Http, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Http, caller);
    };
    Logger.prototype.warn = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Warn) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Warn, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Warn, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Warn, caller);
    };
    Logger.prototype.error = function (msg, options) {
        var caller = (0, get_caller_file_1.default)();
        if (this.shouldPrint(loggerLevels_1.LoggerLevels.Error) || (options && options.force)) {
            this.print(msg, loggerLevels_1.LoggerLevels.Error, caller);
        }
        if (this.options.file) {
            this.printLogFile(msg, loggerLevels_1.LoggerLevels.Error, caller);
        }
        if (options && options.notify)
            this.notify(msg, loggerLevels_1.LoggerLevels.Error, caller);
    };
    Logger.prototype.lineBreak = function () {
        if (!this.options.silent) {
            process.stdout.write('\n');
        }
    };
    // Create a local instance of logger
    Logger.prototype.duplicate = function (options) {
        return new Logger(options, true);
    };
    Object.defineProperty(Logger.prototype, "config", {
        get: function () {
            return this.options;
        },
        enumerable: false,
        configurable: true
    });
    Logger.combine = function (x, y) {
        return (0, deepmerge_1.default)(x, y);
    };
    return Logger;
}());
exports.Logger = Logger;

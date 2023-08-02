"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStream = void 0;
var archiver_1 = __importDefault(require("archiver"));
var filesize_1 = __importDefault(require("filesize"));
var luxon_1 = require("luxon");
var fs_1 = __importDefault(require("fs"));
var app_root_path_1 = __importDefault(require("app-root-path"));
var LocalSizeUnits = {
    b: 0,
    kb: 1,
    mb: 2,
    gb: 3,
};
var FileStream = /** @class */ (function () {
    function FileStream(options) {
        this.queuedLogs = [];
        this.writeQueue = [];
        if (!options.dirname)
            options.dirname = 'logs';
        if (!options.filename)
            options.filename = 'current';
        if (!options.extenstion)
            options.extenstion = 'log';
        if (!options.newLogFileFrequency)
            options.newLogFileFrequency = '24h';
        this.options = options;
        this.directory = this.createFolder(options.dirname);
        this.currentLog = "".concat(this.directory, "/").concat(this.options.filename, ".").concat(this.options.extenstion);
        this.stream = this.createStream();
    }
    FileStream.prototype.createFolder = function (dir) {
        var directory = "".concat(this.options.absolutePath ? this.options.absolutePath : app_root_path_1.default.path, "/").concat(dir);
        if (!fs_1.default.existsSync(directory)) {
            fs_1.default.mkdirSync(directory);
        }
        return directory;
    };
    FileStream.prototype.getFullDate = function (date) {
        return "".concat(date.day, "-").concat(date.month, "-").concat(date.year);
    };
    FileStream.prototype.doesFileExist = function (path) {
        if (this.options.zipArchive)
            path = path.replace(".".concat(this.options.extenstion), '.zip');
        var newPath = '';
        if (fs_1.default.existsSync(path)) {
            var fileExtenstion = this.options.zipArchive
                ? 'zip'
                : this.options.extenstion;
            var splitFilename = path.split('/');
            var filename = splitFilename[splitFilename.length - 1];
            var withoutExtenstion = filename.substring(0, filename.indexOf(".".concat(fileExtenstion)));
            var index = 1;
            while (true) {
                var tempNewFilename = "".concat(path.substring(0, path.indexOf(filename))).concat(withoutExtenstion, "-").concat(index, ".").concat(fileExtenstion);
                if (!fs_1.default.existsSync(tempNewFilename)) {
                    newPath = tempNewFilename;
                    break;
                }
                index++;
            }
        }
        else
            newPath = path;
        return newPath;
    };
    FileStream.prototype.retireFile = function () {
        var date = luxon_1.DateTime.now().minus({ day: 1 });
        var needCustomName = this.options.filename !== 'current';
        var newFilename = "".concat(this.directory, "/log-").concat(this.getFullDate(date)).concat(needCustomName ? this.options.filename : '', ".").concat(this.options.extenstion);
        if (!this.options.zipArchive) {
            newFilename = this.doesFileExist(newFilename);
        }
        fs_1.default.renameSync("".concat(this.currentLog), "".concat(newFilename));
        this.archiveFile(newFilename);
    };
    FileStream.prototype.archiveFile = function (path) {
        if (!this.options.zipArchive)
            return;
        var zipPath = this.doesFileExist(path.replace(".".concat(this.options.extenstion), '.zip'));
        var splitZipPath = zipPath.split('/');
        var filename = splitZipPath[splitZipPath.length - 1].replace('.zip', ".".concat(this.options.extenstion));
        var output = fs_1.default.createWriteStream(zipPath);
        var archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 },
        });
        output.on('close', function () {
            fs_1.default.unlinkSync(path);
        });
        archive.pipe(output);
        archive.file(path, { name: filename });
        archive.finalize();
    };
    FileStream.prototype.createStream = function () {
        var date = luxon_1.DateTime.now();
        var today = this.getFullDate(date);
        if (fs_1.default.existsSync(this.currentLog)) {
            var currentFileBirth = luxon_1.DateTime.fromJSDate(fs_1.default.statSync(this.currentLog).birthtime);
            if (today !== this.getFullDate(currentFileBirth)) {
                this.retireFile();
            }
        }
        return fs_1.default.createWriteStream(this.currentLog, {
            flags: 'a+',
        });
    };
    FileStream.prototype.checkCurrentSize = function () {
        var stats = fs_1.default.statSync(this.currentLog);
        var currentFilesize = (0, filesize_1.default)(stats.size, { output: 'object' });
        var value = currentFilesize.value;
        var unit = currentFilesize.unit.toLowerCase();
        if (value >= this.options.maxFileSize.value &&
            // @ts-ignore
            LocalSizeUnits[this.options.maxFileSize.unit] <=
                // @ts-ignore
                LocalSizeUnits[unit]) {
            this.retireFile();
            this.stream = this.createStream();
        }
    };
    FileStream.prototype.checkDate = function () {
        var date = luxon_1.DateTime.now();
        var today = this.getFullDate(date);
        var currentFileBirth = luxon_1.DateTime.fromJSDate(fs_1.default.statSync(this.currentLog).birthtime);
        if (today !== this.getFullDate(currentFileBirth))
            this.stream = this.createStream();
    };
    FileStream.prototype.write = function (msg) {
        var path = this.stream.path;
        if (fs_1.default.existsSync(path)) {
            if (this.writeQueue[0]) {
                for (var _i = 0, _a = this.writeQueue; _i < _a.length; _i++) {
                    var savedMsg = _a[_i];
                    this.stream.write(savedMsg);
                }
            }
            this.stream.write(msg);
            this.checkDate();
            this.checkCurrentSize();
        }
        else {
            this.writeQueue.push(msg);
        }
    };
    return FileStream;
}());
exports.FileStream = FileStream;

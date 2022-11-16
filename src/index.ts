import colors, { Color } from 'colors';
import { DateTime, LocaleOptions } from 'luxon';
import getCallerFile from 'get-caller-file';
import fs from 'fs';
import nodemailer, { Transporter } from 'nodemailer';
const appRoot = require('app-root-path');
import archiver from 'archiver';
import filesize from 'filesize';
import merge from 'deepmerge';

export enum LoggerLevels {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

export enum FileSizeUnits {
  GB = 'gb',
  MB = 'mb',
  KB = 'kb',
  B = 'b',
}

export enum ColorsEnum {
  Black = 'black',
  Red = 'red',
  Green = 'green',
  Yellow = 'yellow',
  Blue = 'blue',
  Magenta = 'magenta',
  Cyan = 'cyan',
  White = 'white',
  Gray = 'gray',
  Grey = 'grey',
  BrightRed = 'brightRed',
  BrightGreen = 'brightGreen',
  BrightYellow = 'brightYellow',
  BrightBlue = 'brightBlue',
  BrightMagenta = 'brightMagenta',
  BrightCyan = 'brightCyan',
  BrightWhite = 'brightWhite',
}

interface Format {
  color?: ColorsEnum;
  text?: string;
}

interface LoggerMessageOptions {
  static?: Format;
  level?: {
    silly?: Format;
    debug?: Format;
    verbose?: Format;
    http?: Format;
    info?: Format;
    warn?: Format;
    error?: Format;
  };
  timestamp?: boolean;
  color?: ColorsEnum;
}

interface LoggerFileOptions {
  newLogFileFrequency?: string;
  maxFileSize: {
    value: number;
    unit: FileSizeUnits;
  };
  zipArchive?: boolean;
  dirname?: string;
  absolutPath?: string;
  filename?: string;
  extenstion?: string;
}

interface LoggerNotifyOptions {
  levels?: LoggerLevels[] | boolean;
  recipiants: string[];
  transport: Transporter;
  sender: string;
  applicationName: string;
}

interface LoggerCallLocalOptions {
  force?: boolean;
  notify?: boolean;
}

export interface LoggerOptions {
  silent?: LoggerLevels[] | boolean;
  file?: LoggerFileOptions;
  notify?: LoggerNotifyOptions;
  message?: LoggerMessageOptions;
  showSourceFile?: ColorsEnum;
  colors?: boolean;
  name?: string;
}

let globalLoggerOptions: LoggerOptions = {
  silent: false,
  showSourceFile: ColorsEnum.BrightGreen,
  colors: true,
  message: {
    // static: {
    //   text: 'Test',
    //   color: ColorsEnum.Black,
    // },
    level: {
      silly: {
        color: ColorsEnum.BrightWhite,
      },
      debug: {
        color: ColorsEnum.Green,
      },
      verbose: {
        color: ColorsEnum.Magenta,
      },
      http: {
        color: ColorsEnum.Green,
      },
      info: {
        color: ColorsEnum.Blue,
      },
      warn: {
        color: ColorsEnum.Yellow,
      },
      error: {
        color: ColorsEnum.Red,
      },
    },
    timestamp: true,
    color: ColorsEnum.White,
  },
};

const LocalSizeUnits = {
  b: 0,
  kb: 1,
  mb: 2,
  gb: 3,
};

class FileStream {
  stream: fs.WriteStream;
  options: LoggerFileOptions;
  directory: string;
  currentLog: string;

  constructor(options: LoggerFileOptions) {
    if (!options.dirname) options.dirname = 'logs';
    if (!options.filename) options.filename = 'current';
    if (!options.extenstion) options.extenstion = 'log';
    if (!options.newLogFileFrequency) options.newLogFileFrequency = '24h';

    this.options = options;

    this.directory = this.createFolder(options.dirname);

    this.currentLog = `${this.directory}/${this.options.filename}.${this.options.extenstion}`;

    this.stream = this.createStream();
  }

  private createFolder(dir: string): string {
    const directory = `${
      this.options.absolutPath ? this.options.absolutPath : appRoot.path
    }/${dir}`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    return directory;
  }

  private getFullDate(date: DateTime): string {
    return `${date.day}-${date.month}-${date.year}`;
  }

  private doesFileExist(path: string) {
    if (this.options.zipArchive)
      path = path.replace(`.${this.options.extenstion!}`, '.zip');

    let newPath = '';
    if (fs.existsSync(path)) {
      const fileExtenstion = this.options.zipArchive
        ? 'zip'
        : this.options.extenstion;
      const splitFilename = path.split('/');
      const filename = splitFilename[splitFilename.length - 1];
      const withoutExtenstion = filename.substring(
        0,
        filename.indexOf(`.${fileExtenstion}`),
      );

      let index = 1;
      while (true) {
        const tempNewFilename = `${path.substring(
          0,
          path.indexOf(filename),
        )}${withoutExtenstion}-${index}.${fileExtenstion}`;

        if (!fs.existsSync(tempNewFilename)) {
          newPath = tempNewFilename;
          break;
        }

        index++;
      }
    } else newPath = path;

    return newPath;
  }

  private retireFile() {
    const date = DateTime.now();

    const needCustomName = this.options.filename !== 'current';

    let newFilename = `${this.directory}/log-${this.getFullDate(date)}${
      needCustomName ? this.options.filename : ''
    }.${this.options.extenstion}`;

    if (!this.options.zipArchive) {
      newFilename = this.doesFileExist(newFilename);
    }

    fs.renameSync(`${this.currentLog}`, `${newFilename}`);
    this.archiveFile(newFilename);
  }

  private archiveFile(path: string) {
    if (!this.options.zipArchive) return;

    const zipPath = this.doesFileExist(
      path.replace(`.${this.options.extenstion!}`, '.zip'),
    );
    const splitZipPath = zipPath.split('/');
    const filename = splitZipPath[splitZipPath.length - 1].replace(
      '.zip',
      `.${this.options.extenstion!}`,
    );

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      fs.unlinkSync(path);
    });

    archive.pipe(output);

    archive.file(path, { name: filename });

    archive.finalize();
  }

  private createStream(): fs.WriteStream {
    const date = DateTime.now();
    const today = this.getFullDate(date);

    if (fs.existsSync(this.currentLog)) {
      const currentFileBirth = DateTime.fromJSDate(
        fs.statSync(this.currentLog).birthtime,
      );

      if (today !== this.getFullDate(currentFileBirth)) {
        this.retireFile();
      }
    }

    return fs.createWriteStream(this.currentLog, {
      flags: 'a+',
    });
  }

  private checkCurrentSize() {
    const stats = fs.statSync(this.currentLog);
    const currentFilesize = filesize(stats.size, { output: 'object' });

    const value = currentFilesize.value;
    const unit = currentFilesize.unit.toLowerCase();

    if (
      value >= this.options.maxFileSize.value &&
      // @ts-ignore
      LocalSizeUnits[this.options.maxFileSize.unit as string] <=
        // @ts-ignore
        LocalSizeUnits[unit]
    ) {
      this.retireFile();
      this.stream = this.createStream();
    }
  }

  private checkDate() {
    const date = DateTime.now();
    const today = this.getFullDate(date);

    const currentFileBirth = DateTime.fromJSDate(
      fs.statSync(this.currentLog).birthtime,
    );

    if (today !== this.getFullDate(currentFileBirth))
      this.stream = this.createStream();
  }

  write(msg: string) {
    this.stream.write(msg, 'utf8');

    this.checkDate();
    this.checkCurrentSize();
  }
}

let emailTransport: Transporter | undefined;

class Logger {
  private options: LoggerOptions;
  private emailTransport?: Transporter;
  private fileStream?: FileStream;

  constructor(options?: LoggerOptions, updateGlobalOptions?: boolean) {
    colors.enable();
    if (options) {
      if (options.notify) {
        if (options.notify.transport) {
          if (!emailTransport) {
            this.emailTransport = options.notify.transport;
          } else {
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
      this.options = merge(globalLoggerOptions, options);
      if (updateGlobalOptions) {
        globalLoggerOptions = this.options;
      }
    } else {
      this.options = globalLoggerOptions;
    }

    if (this.options.file) this.fileStream = new FileStream(this.options.file);
  }

  private determineColor(color: string | undefined): string {
    return color ? color : ColorsEnum.White;
  }

  private parseExtras(caller: string, disableColors?: boolean): string {
    const { options } = this;

    let extras = '';

    if (options) {
      if (options.message) {
        if (options.message.static) {
          if (options.message.static.text) {
            extras += `[${this.colorText(
              options.message.static.text,
              this.determineColor(options.message.static.color),
              disableColors,
            )}]`;
          }
        }
      }

      if (options.showSourceFile) {
        const splitPath = caller.split('/');
        const fileName = splitPath[splitPath.length - 1];

        extras += `[${this.colorText(
          fileName,
          this.determineColor(options.showSourceFile),
          disableColors,
        )}]`;
      }
    }

    return extras;
  }

  private colorText(text: string, color: string, disableColors?: boolean) {
    if (this.options.colors === true && !disableColors) {
      // @ts-ignore
      return colors[color](text);
    } else {
      return text;
    }
  }

  private getDate(disable?: boolean): string {
    if (this.options!.message!.timestamp) {
      const dt = DateTime.now();

      const date = dt
        .setLocale('SE')
        .toLocaleString(DateTime.TIME_24_WITH_SECONDS);

      if (!disable) {
        return `[${this.colorText(date, ColorsEnum.BrightBlue)}]`;
      } else {
        return `[${date}]`;
      }
      // @ts-ignore
    } else return '';
  }

  private async print(msg: string, level: string, caller: string) {
    //@ts-ignore
    const color = this.options!.message!.level![level].color;

    // @ts-ignore
    process.stdout.write(
      `${this.getDate()}[${this.colorText(
        level.toUpperCase(),
        color,
      )}]${this.parseExtras(caller)}: ${msg}\n`,
    );
  }

  private async printLogFile(msg: string, level: LoggerLevels, caller: string) {
    if (this.fileStream) {
      const text = `${this.getDate(
        true,
      )}[${level.toUpperCase()}]${this.parseExtras(caller, true)}: ${msg}\n`;

      this.fileStream.write(text);
    }
  }

  private shouldPrint(level: LoggerLevels) {
    return (
      !this.options.silent ||
      (typeof this.options.silent === 'object' &&
        !this.options.silent.includes(level))
    );
  }

  private notify(msg: string, level: LoggerLevels, caller: string) {
    if (this.options.notify) {
      const emailOpts = this.options.notify;

      let recipiants = '';
      for (const recipiant of emailOpts.recipiants) {
        if (recipiants === '') {
          recipiants += recipiant;
        } else {
          recipiants += `, ${recipiant}`;
        }
      }

      const text = `${this.getDate(
        true,
      )}[${level.toUpperCase()}]${this.parseExtras(caller, true)}: ${msg}\n`;

      if (!this.emailTransport) {
        throw new Error('Email transport is not defined');
      }

      this.emailTransport!.sendMail({
        from: emailOpts.sender,
        to: recipiants,
        subject: `Logger notification ${
          emailOpts.applicationName
        }: ${level.toUpperCase()}`,
        text,
      });
    }
  }

  silly(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();

    if (
      this.shouldPrint(LoggerLevels.Silly) ||
      (options && options && options.force)
    ) {
      this.print(msg, LoggerLevels.Silly, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Silly, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Silly, caller);
  }

  debug(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();

    if (this.shouldPrint(LoggerLevels.Debug) || (options && options.force)) {
      this.print(msg, LoggerLevels.Debug, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Debug, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Debug, caller);
  }

  verbose(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();
    if (this.shouldPrint(LoggerLevels.Verbose) || (options && options.force)) {
      this.print(msg, LoggerLevels.Verbose, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Verbose, caller);
    }

    if (options && options.notify)
      this.notify(msg, LoggerLevels.Verbose, caller);
  }

  info(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();
    if (this.shouldPrint(LoggerLevels.Info) || (options && options.force)) {
      this.print(msg, LoggerLevels.Info, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Info, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Info, caller);
  }

  http(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();
    if (this.shouldPrint(LoggerLevels.Http) || (options && options.force)) {
      this.print(msg, LoggerLevels.Http, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Http, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Http, caller);
  }

  warn(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();
    if (this.shouldPrint(LoggerLevels.Warn) || (options && options.force)) {
      this.print(msg, LoggerLevels.Warn, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Warn, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Warn, caller);
  }

  error(msg: string, options?: LoggerCallLocalOptions) {
    const caller = getCallerFile();
    if (this.shouldPrint(LoggerLevels.Error) || (options && options.force)) {
      this.print(msg, LoggerLevels.Error, caller);
    }

    if (this.options.file) {
      this.printLogFile(msg, LoggerLevels.Error, caller);
    }

    if (options && options.notify) this.notify(msg, LoggerLevels.Error, caller);
  }

  // Create a local instance of logger
  duplicate(options: LoggerOptions): Logger {
    return new Logger(options, true);
  }

  get config() {
    return this.options;
  }

  static combine(x: object, y: object): object {
    return merge(x, y);
  }
}

export default Logger;

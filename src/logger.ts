import colors from 'colors';
import getCallerFile from 'get-caller-file';
import { DateTime } from 'luxon';
import { Transporter } from 'nodemailer';
import { ColorsEnum } from './enums/colorsEnum';
import { LoggerLevels } from './enums/loggerLevels';
import { FileStream } from './fileStream';
import { LoggerOptions } from './interfaces/loggerOptions';
import merge from 'deepmerge';
import { LoggerCallLocalOptions } from './interfaces/loggerCallLocalOptions';

let emailTransport: Transporter | undefined;

export let globalLoggerOptions: LoggerOptions = {
  silent: false,
  showSourceFile: ColorsEnum.BrightGreen,
  colors: true,
  message: {
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

export class Logger {
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

  lineBreak() {
    if (!this.options.silent) {
      process.stdout.write('\n');
    }
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

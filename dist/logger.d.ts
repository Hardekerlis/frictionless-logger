import { LoggerOptions } from './interfaces/loggerOptions';
import { LoggerCallLocalOptions } from './interfaces/loggerCallLocalOptions';
export declare let globalLoggerOptions: LoggerOptions;
export declare class Logger {
    private options;
    private emailTransport?;
    private fileStream?;
    constructor(options?: LoggerOptions, updateGlobalOptions?: boolean);
    private determineColor;
    private parseExtras;
    private colorText;
    private getDate;
    private print;
    private printLogFile;
    private shouldPrint;
    private notify;
    silly(msg: string, options?: LoggerCallLocalOptions): void;
    debug(msg: string, options?: LoggerCallLocalOptions): void;
    verbose(msg: string, options?: LoggerCallLocalOptions): void;
    info(msg: string, options?: LoggerCallLocalOptions): void;
    http(msg: string, options?: LoggerCallLocalOptions): void;
    warn(msg: string, options?: LoggerCallLocalOptions): void;
    error(msg: string, options?: LoggerCallLocalOptions): void;
    lineBreak(): void;
    duplicate(options: LoggerOptions): Logger;
    get config(): LoggerOptions;
    static combine(x: object, y: object): object;
}

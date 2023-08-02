import { LoggerLevels, ColorsEnum } from '../enums';
import { LoggerFileOptions } from './loggerFileOptions';
import { LoggerNotifyOptions } from './loggerNotifyOptions';
import { LoggerMessageOptions } from './messageOptions';
export interface LoggerOptions {
    silent?: LoggerLevels[] | boolean;
    file?: LoggerFileOptions;
    notify?: LoggerNotifyOptions;
    message?: LoggerMessageOptions;
    showSourceFile?: ColorsEnum;
    colors?: boolean;
}

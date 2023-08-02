/// <reference types="node" />
import { LoggerFileOptions } from './interfaces/loggerFileOptions';
import fs from 'fs';
export declare class FileStream {
    stream: fs.WriteStream;
    options: LoggerFileOptions;
    directory: string;
    currentLog: string;
    queuedLogs: string[];
    constructor(options: LoggerFileOptions);
    private createFolder;
    private getFullDate;
    private doesFileExist;
    private retireFile;
    private archiveFile;
    private createStream;
    private checkCurrentSize;
    private checkDate;
    writeQueue: string[];
    write(msg: string): void;
}

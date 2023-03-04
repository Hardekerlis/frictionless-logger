import archiver from 'archiver';
import filesize from 'filesize';
import { DateTime } from 'luxon';
import { LoggerFileOptions } from './interfaces/loggerFileOptions';
import fs from 'fs';
import appRoot from 'app-root-path';

const LocalSizeUnits = {
  b: 0,
  kb: 1,
  mb: 2,
  gb: 3,
};

export class FileStream {
  stream: fs.WriteStream;
  options: LoggerFileOptions;
  directory: string;
  currentLog: string;
  queuedLogs: string[] = [];

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
      this.options.absolutePath ? this.options.absolutePath : appRoot.path
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
    const date = DateTime.now().minus({ day: 1 });

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

  writeQueue: string[] = [];

  write(msg: string) {
    const path = this.stream.path;
    if (fs.existsSync(path)) {
      if (this.writeQueue[0]) {
        for (const savedMsg of this.writeQueue) {
          this.stream.write(savedMsg);
        }
      }

      this.stream.write(msg);

      this.checkDate();
      this.checkCurrentSize();
    } else {
      this.writeQueue.push(msg);
    }
  }
}

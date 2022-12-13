import { FileSizeUnits } from '../';

export interface LoggerFileOptions {
  newLogFileFrequency?: string;
  maxFileSize: {
    value: number;
    unit: FileSizeUnits;
  };
  zipArchive?: boolean;
  dirname?: string;
  absolutePath?: string;
  filename?: string;
  extenstion?: string;
}

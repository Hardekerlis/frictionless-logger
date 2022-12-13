import { ColorsEnum } from '../enums/';
import { Format } from './optionKeyValuePairInterface';

export interface LoggerMessageOptions {
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

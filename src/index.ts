import { Logger } from './logger';
export * from './enums';
export * from './fileStream';
export * from './interfaces';

const logger = new Logger();

export { logger };
export default Logger;

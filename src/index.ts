import { Logger } from './logger';
export * from './enums';
export * from './interfaces';
export * from './fileStream';

const logger = new Logger();

export { logger };

export default Logger;

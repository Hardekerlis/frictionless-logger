import { Transporter } from 'nodemailer';
import { LoggerLevels } from '../';
export interface LoggerNotifyOptions {
    levels?: LoggerLevels[] | boolean;
    recipiants: string[];
    transport: Transporter;
    sender: string;
    applicationName: string;
}

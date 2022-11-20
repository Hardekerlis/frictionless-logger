### Frictionless logger

Frictionless logger is a highly customizable logger with support for both production and development environments

#### Setting up the logger

```typescript
import Logger, { FileSizeUnits, LoggerLevels } from 'frictionless-logger';

interface LoggerOptions {
  silent?: LoggerLevels[] | boolean;
  file?: LoggerFileOptions;
  notify?: LoggerNotifyOptions;
  message?: LoggerMessageOptions;
  showSourceFile?: ColorsEnum;
  colors?: boolean;
  name?: string;
}

const logger = new Logger({
  silent: true, // Stop the logger from printing to the console. Default is false
  file: {
    newLogFileFrequency: '12h', // How often the current logfile should be archived and a new log file to be created
    maxFileSize: {
      value: 10 // How large the log file should be before it is archived
      unit: FileSizeUnits.MB // size unit
    },
    zipArchive: true, // Should archived log files be zipped,
    dirname: 'logs', // The name of the logs folder
    absolutePath: 'C://user/desktop/logs', // The absolute path the logs folder should be created at
    filename: 'log', // The name of the current log file. Default is "current"
    extenstion: 'log' // What file extenstion should the log file have. Default is log
  },
  notify: { // Notify is optional. Leave it undefined if you dont want/need notifications
    levels: [LoggerLevels.Error], // What log level should trigger a notification. False for disabled which is default
    recipiants: ["example@example.com"],
    transport: Transporter, // Nodemailer transporter
    sender: "application@example.com", // Who is the sender of the email
    applicationName: "Name of your application", // This is used for the subject line in the email
  },
  message: {
    {
      // Static is a label in your log message where you can specify a static message. For example in your
      // authentication router you could have "Authentication" and it would print it in your logs
      static: {
        color: ColorsEnum.BrightGreen, // Color of the static message
        text: "Authentication" // The label name
      },
      level: {
        silly: Format, // Format follows the same format as static
        debug: Format,
        verbose: Format,
        http: Format,
        info: Format,
        warn: Format,
        error: Format,
      },
      timestamp: boolean,
      color: ColorsEnum, // The color your logs
    }
  },
  showSourceFile: ColorsEnum.Yellow, // ShowSourceFile will tell what the name of the file is where your log is comming from. Default is undefined
  colors: false, // Should colors be enabled or not. Default is true
}, true); // If true is passed as a second argument the config passed into the logger constructor will be saved for future initializations of the logger

// In the case the second argument is true the logger below will have the same config

const logger2 = new Logger();
```

#### Using the logger

```typescript
const logger = new Logger();

logger.silly('silly message');
logger.debug('debug message');
logger.verbose('verbose message');
logger.http('http message');
logger.info('info message');
logger.warn('warn message');
logger.error('error message');

// In the case the logger is silenced but you still want a log to print to the console you cant pass an argument after your message
logger.info('This log is really important', {
  notify: true, // This will send an email notification to the desired recipiants
  force: true, // This will force the log to the terminal if you have silenced the logger
});
```

#### Advanced logger configuration

```typescript
import Logger from 'frictionless-logger';

const config = {
  file: {
    newLogFileFrequency: '12h', // How often the current logfile should be archived and a new log file to be created
    maxFileSize: {
      value: 10 // How large the log file should be before it is archived
      unit: FileSizeUnits.MB // size unit
    },
    zipArchive: true, // Should archived log files be zipped,
    dirname: 'logs', // The name of the logs folder
    absolutePath: 'C://user/desktop/logs', // The absolute path the logs folder should be created at
    filename: 'log', // The name of the current log file. Default is "current"
    extenstion: 'log' // What file extenstion should the log file have. Default is log
  }
}

const logger1 = new Logger(); // Will not have global config


// This will save as a global config which will initialize on all new loggers
new Logger(
  Logger.combine(
    config,
    {
      notify: {
        levels: [LoggerLevels.Error],
        recipiants: ["example@example.com"],
        transport: Transporter,
        sender: "application@example.com",
        applicationName: "Name of your application",
    }
}), true);


const logger = new Logger(); // Has global config
```

## License

The MIT License (MIT)
Copyright © 2022 <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

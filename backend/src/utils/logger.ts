import winston from 'winston';
import { config } from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transport if LOG_FILE is specified
if (config.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: config.LOG_FILE,
      format: logFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
});

export default logger;
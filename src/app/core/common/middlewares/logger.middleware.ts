import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import TransportStream from 'winston-transport';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logDir = path.resolve(process.cwd(), 'logs');

    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Setting up rotation of transport logs
    const fileTransport = new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '5d', // 5 days
    });

    const transports: TransportStream[] = [fileTransport];

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} [${level}]: ${message}`;
            }),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: transports,
    });
  }

  log(message: any) {
    this.logger.log({
      level: 'info',
      message,
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  error(message: string, stack?: string) {
    this.logger.error(`${message} - ${stack || 'No stack trace'}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}

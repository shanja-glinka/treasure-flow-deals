import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import * as morgan from 'morgan';
import { LoggerService } from './logger.middleware';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    morgan.token(
      'message',
      (req: Request, res: Response) => res.locals.errorMessage || '',
    );
  }

  getIpFormat() {
    return this.configService.get<string>('NODE_ENV') === 'production'
      ? ':remote-addr - '
      : '';
  }

  successResponseFormat() {
    return `${this.getIpFormat()}:method :url :status - :response-time ms`;
  }

  errorResponseFormat() {
    return `${this.getIpFormat()}:method :url :status - :response-time ms - message: :message`;
  }

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        res.locals.errorMessage = 'An error occurred';
      }
    });

    morgan(
      (tokens, req, res) => {
        const format =
          res.statusCode >= 400
            ? this.errorResponseFormat()
            : this.successResponseFormat();
        return morgan.compile(format)(tokens, req, res);
      },
      {
        stream: {
          write: (message: string) => {
            const statusMatch = message.match(/ (\d{3}) -/);
            const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

            if (status >= 400) {
              this.loggerService.error(message.trim());
            } else {
              if (this.configService.get<string>('NODE_ENV') !== 'production') {
                this.loggerService.info(message.trim());
              }
            }
          },
        },
      },
    )(req, res, next);
  }
}

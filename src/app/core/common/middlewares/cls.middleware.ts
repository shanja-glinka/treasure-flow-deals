import { Injectable, NestMiddleware } from '@nestjs/common';
import { createNamespace } from 'cls-hooked';
import { NextFunction, Request, Response } from 'express';
import { ApplicationNamespace } from '../../constants';

export const applicationNamespace = createNamespace(ApplicationNamespace);

@Injectable()
export class ClsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    applicationNamespace.run(() => next());
  }
}

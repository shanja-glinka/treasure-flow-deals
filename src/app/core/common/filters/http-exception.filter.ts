import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { ApiProperty } from '@nestjs/swagger';
import { Response } from 'express';
import { LoggerService } from '../../middlewares';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Статус ответа',
    example: 'error',
  })
  status: string;

  @ApiProperty({
    description: 'Код ошибки',
    example: 400,
  })
  code: number;

  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'Bad Request',
  })
  message: string;

  @ApiProperty({
    description: 'Детали ошибки',
    example: ['Название поля обязательно'],
    required: false,
    isArray: true,
  })
  errors?: any[];

  constructor(code: number, message: string, errors?: any[]) {
    this.status = 'error';
    this.code = code;
    this.message = message;
    if (errors) {
      this.errors = errors;
    }
  }
}

@Catch()
export class AllExceptionsFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    applicationRef: HttpAdapterHost,
    private readonly loggerService?: LoggerService,
  ) {
    super(applicationRef.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    let errors = [];

    if (
      exception instanceof HttpException &&
      typeof exception.getResponse() === 'object'
    ) {
      const res = exception.getResponse() as any;
      if (res.errors) {
        errors = Array.isArray(res.errors) ? res.errors : [res.errors];
      } else if (res.message) {
        errors = Array.isArray(res.message) ? res.message : [res.message];
      }
    }

    const errorResponse = new ErrorResponseDto(status, message, errors);

    this.logError(exception, status);

    response.status(status).json(errorResponse);
  }

  private logError(exception: unknown, status: number) {
    const errorMessage =
      exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred';
    const errorStack = exception instanceof Error ? exception.stack : '';

    if (status >= 400) {
      this.loggerService.error(errorMessage, errorStack);
    }
  }
}

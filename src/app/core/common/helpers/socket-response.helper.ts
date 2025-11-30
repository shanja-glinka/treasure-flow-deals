import { Socket } from 'socket.io';
import { ErrorResponseDto } from '../filters/http-exception.filter';
import { SuccessResponseDto } from '../interceptors/response.interceptor';
import { HttpException } from '@nestjs/common';

export class SocketResponseHelper {
  static sendSuccessResponse<T>(client: Socket, data: T, event?: string): any {
    const response = new SuccessResponseDto<T>(data);

    if (event) {
      client.emit(event, response);
    }
    return response;
  }

  static sendErrorResponse(client: Socket, error: any, event?: string): any {
    const statusCode =
      error instanceof HttpException ? (error?.getStatus?.() ?? 500) : 500;
    let errors = [];

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    if (
      error instanceof HttpException &&
      typeof error.getResponse() === 'object'
    ) {
      const res = error.getResponse() as any;
      if (res.errors) {
        errors = Array.isArray(res.errors) ? res.errors : [res.errors];
      } else if (res.message) {
        errors = Array.isArray(res.message) ? res.message : [res.message];
      }
    }

    const response = new ErrorResponseDto(statusCode, message, errors);

    if (event) {
      // client.emit(event, response);
    }
    return response;
  }
}

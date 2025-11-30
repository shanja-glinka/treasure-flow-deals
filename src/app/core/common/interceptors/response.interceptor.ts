import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class SuccessResponseDto<T> {
  @ApiProperty({
    description: 'Статус ответа',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Данные ответа',
    type: Object,
  })
  data: T;

  @ApiProperty({
    description: 'Дополнительная информация',
    example: null,
    required: false,
  })
  meta?: any;

  constructor(data: T, meta?: any) {
    this.status = 'success';
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        return new SuccessResponseDto<T>(data);
      }),
    );
  }
}

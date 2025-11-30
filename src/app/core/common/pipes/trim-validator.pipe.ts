import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';

@Injectable()
export class TrimValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (
      metadata.type === 'body' &&
      typeof value === 'object' &&
      value !== null
    ) {
      // Если значение – массив, обрабатываем каждый элемент отдельно
      if (Array.isArray(value)) {
        value = value.map((item) => this.stripWhitespace(item));
      } else {
        value = this.stripWhitespace(value);
      }
    }
    return super.transform(value, metadata);
  }

  private stripWhitespace(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    // Создаем копию объекта (или массива), чтобы не мутировать исходное значение
    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        newObj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        newObj[key] = this.stripWhitespace(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
}

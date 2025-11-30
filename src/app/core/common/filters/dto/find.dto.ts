import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsMongoIdOrSlug } from '../../../validators/mongoid-or-slug.validator';
import { OrderOptionDTO } from './order-option.dto';
import { PaginationOptionsDTO } from './pagination-options.dto';

/**
 * DTO для фильтрации по массиву значений.
 * Используется для фильтрации документов по массиву идентификаторов или других значений.
 */
export class FilterArrayOfIdDTO {
  @ApiPropertyOptional({
    description:
      'Массив значений для фильтрации. Каждый элемент должен быть валидным MongoDB ObjectId.',
    type: [String],
    example: ['63f9f9b5c9e77b7e4a1b6c7f'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  values?: string[];
}

/**
 * DTO для фильтрации по массиву значений.
 * Используется для фильтрации документов по массиву идентификаторов/slug или других значений.
 */
export class FilterArrayOfIdOrSlugDTO {
  @ApiPropertyOptional({
    description:
      'Массив значений для фильтрации. Каждый элемент должен быть валидным MongoDB ObjectId или slug (латиница, цифры, дефисы и подчеркивания, без пробелов).',
    type: [String],
    example: ['63f9f9b5c9e77b7e4a1b6c7f', 'period__aleksandr--i'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoIdOrSlug({ each: true })
  values?: string[];
}

/**
 * DTO для фильтрации по массиву значений.
 * Используется для фильтрации документов по массиву идентификаторов или других значений.
 */
export class FilterArrayDTO {
  @ApiPropertyOptional({
    description:
      'Массив значений для фильтрации. Каждый элемент должен быть строкой.',
    type: [String],
    example: ['63f9f9b5c9e77b7e4a1b6c7f'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}

/**
 * DTO для подстрокового поиска.
 * Позволяет выполнять поиск по подстроке в строковом поле.
 */
export class FilterSearchDTO {
  @ApiPropertyOptional({
    description:
      'Подстрока для поиска. Используется оператор "like" для выполнения подстрокового поиска.',
    example: 'example',
  })
  @IsOptional()
  @IsString()
  like?: string;
}

/**
 * DTO для фильтрации по диапазону дат.
 * Позволяет фильтровать документы, созданные в определённый период времени.
 */
export class FilterDateDTO {
  @ApiPropertyOptional({
    description: 'Начальная дата диапазона. Формат ISO 8601.',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Конечная дата диапазона. Формат ISO 8601.',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

/**
 * DTO для фильтрации по диапазону дат.
 * Позволяет фильтровать документы, созданные в определённый период времени.
 */
export class FilterRangeDTO {
  @ApiPropertyOptional({
    description: 'Начальная дата диапазона.',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  from?: number;

  @ApiPropertyOptional({
    description: 'Конечная дата диапазона.',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  to?: number;
}

/**
 * Базовый DTO для поиска с поддержкой фильтрации, сортировки и пагинации.
 * Используется для передачи параметров поиска в репозиторий или сервис.
 */
export class BaseFindDTO<F> {
  @ApiPropertyOptional({
    description: 'Фильтры для поиска.',
    type: Object,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  filter?: F;

  @ApiPropertyOptional({
    description: 'Параметры сортировки.',
    type: [OrderOptionDTO],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderOptionDTO)
  order?: OrderOptionDTO<any>[];

  @ApiPropertyOptional({
    description: 'Параметры пагинации.',
    type: PaginationOptionsDTO,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationOptionsDTO)
  pagination?: PaginationOptionsDTO;

  @ApiPropertyOptional({
    description: 'Поля для популяции (populate).',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  with?: string[] | any;

  @ApiPropertyOptional({
    description: 'Модификация документов.',
    type: Object,
  })
  @IsOptional()
  @Type(() => Object)
  modifier?: object | any;
}

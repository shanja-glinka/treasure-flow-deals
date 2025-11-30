import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO для параметров сортировки.
 * Позволяет определить направление сортировки и поле, по которому производится сортировка.
 */
export class OrderOptionDTO<T extends { _id?: any }> {
  @ApiPropertyOptional({
    description:
      'Направление сортировки. ASC (по возрастанию) или DESC (по убыванию).',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description:
      'Поле, по которому производится сортировка. По умолчанию "_id".',
    default: '_id',
  })
  @IsOptional()
  @IsString()
  orderBy?: keyof T = '_id';
}

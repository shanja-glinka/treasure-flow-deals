import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * DTO для параметров пагинации.
 * Используется для определения количества элементов на странице и текущей страницы.
 */
export class PaginationOptionsDTO {
  @ApiPropertyOptional({
    description: 'Количество элементов на странице.',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  itemsPerPage?: number = 10;

  @ApiPropertyOptional({
    description: 'Номер текущей страницы.',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  currentPage?: number = 1;
}

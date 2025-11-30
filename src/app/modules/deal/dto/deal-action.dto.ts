import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class DealDisputeDto {
  @ApiProperty({ description: 'Причина спора' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class DealCounterOfferDto {
  @ApiProperty({ description: 'Предложенная цена' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class DealCounterOfferResponseDto {
  @ApiProperty({ description: 'Принять ли контроффер' })
  @IsBoolean()
  accept: boolean;
}

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { BaseFindDTO } from '@root/src/app/core/common/filters/dto/find.dto';
import { DealStatusEnum } from '@root/src/app/core/schemas/deal.schema';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';

export enum DealViewAs {
  SELLER = 'seller',
  BUYER = 'buyer',
}

export class FilterDealDTO {
  @ApiPropertyOptional({
    description: 'Статус сделки.',
    enum: DealStatusEnum,
    example: DealStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DealStatusEnum)
  status?: DealStatusEnum;
}
export class FindDealDTO extends BaseFindDTO<FilterDealDTO> {
  @ApiProperty({
    description: 'От чьего имени смотреть сделки: seller или buyer',
    enum: DealViewAs,
    default: DealViewAs.SELLER,
  })
  @IsEnum(DealViewAs)
  viewAs: DealViewAs = DealViewAs.SELLER;

  @ApiPropertyOptional({
    description: 'Фильтры для поиска сделок.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDealDTO)
  filter?: FilterDealDTO;
}

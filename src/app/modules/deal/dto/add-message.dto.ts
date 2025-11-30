import { UserShortData } from '@root/src/app/core/schemas/user.schema';
import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddMessageDto {
  @IsMongoId()
  @IsString()
  dealId: string;

  @IsOptional()
  userId?: string;

  @IsOptional()
  user: UserShortData;

  @IsString()
  @MinLength(1, { message: 'Message must be at least 1 character long.' })
  @MaxLength(255, { message: 'Message cannot exceed 500 characters.' })
  message: string;
}

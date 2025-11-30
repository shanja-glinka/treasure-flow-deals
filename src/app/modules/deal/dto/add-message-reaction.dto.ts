import { MessageReaction } from '@root/src/app/core/enums';
import { UserShortData } from '@root/src/app/core/schemas/user.schema';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddMessageReactionDto {
  @IsMongoId()
  @IsString()
  dealId: string;

  @IsNumber()
  messageId: number;

  @IsEnum(MessageReaction, {
    message: 'Неверный тип реакции.',
  })
  reaction: MessageReaction;

  @IsOptional()
  userId?: string;

  @IsOptional()
  user: UserShortData;
}

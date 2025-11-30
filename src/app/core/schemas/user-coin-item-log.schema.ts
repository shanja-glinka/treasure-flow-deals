import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CoinItemActionTypeEnum } from '../enums';

@Schema({ _id: false })
export class UserCoinItemLog {
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String, enum: CoinItemActionTypeEnum, required: true })
  action: CoinItemActionTypeEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  from: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  to: Types.ObjectId | null;
}

export const UserCoinItemLogSchema =
  SchemaFactory.createForClass(UserCoinItemLog);

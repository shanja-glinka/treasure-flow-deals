import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';
import { DealModeEnum } from './deal.schema';

@Schema({ versionKey: false, timestamps: true })
export class CoinDealStat extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Deal', required: true })
  dealId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin', required: true })
  coinId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  buyer: Types.ObjectId | null;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', default: null })
  conditionId: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  soldAt: Date;

  @Prop({ type: String, enum: DealModeEnum, required: true })
  mode: DealModeEnum;
}

export type CoinDealStatDocument = HydratedDocument<CoinDealStat>;
export const CoinDealStatSchema = SchemaFactory.createForClass(CoinDealStat);

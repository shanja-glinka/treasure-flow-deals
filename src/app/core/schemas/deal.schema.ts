import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';

export enum DealTypeEnum {
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Schema({ versionKey: false, timestamps: true })
export class Deal extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'UserCoinItem', required: true })
  item: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin', required: true })
  coin: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true, unique: true, index: true })
  auction: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  buyer?: Types.ObjectId;

  @Prop({
    type: String,
    enum: DealTypeEnum,
    default: DealTypeEnum.ACTIVE,
  })
  status: DealTypeEnum;

  @Prop({ type: Number, required: true })
  startingPrice: number;

  @Prop({ type: Number, default: null })
  finalPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  condition: Types.ObjectId;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: String, default: null })
  note: string | null;

  @Prop({
    type: {
      totalBids: Number,
      highestBid: Number,
      auctionDuration: Number,
    },
    default: {},
  })
  auctionStats: {
    totalBids: number;
    highestBid: number;
    auctionDuration: number;
  };
}
export type DealDocument = HydratedDocument<Deal>;
export const DealSchema = SchemaFactory.createForClass(Deal);
// Гарантируем уникальность сделки на аукцион
DealSchema.index({ auction: 1 }, { unique: true });

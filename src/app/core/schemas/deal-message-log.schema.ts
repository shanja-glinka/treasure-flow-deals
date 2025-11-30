import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';

@Schema({ versionKey: false, timestamps: true })
export class DealMessageLog extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Deal', required: true })
  deal: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction', required: false })
  auction: Types.ObjectId;
}
export type DealMessageLogDocument = HydratedDocument<DealMessageLog>;
export const DealMessageLogSchema =
  SchemaFactory.createForClass(DealMessageLog);

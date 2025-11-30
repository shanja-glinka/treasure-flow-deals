import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';
import { InventoryVisibilityEnum } from '../enums';
import {
  UserCoinItemLog,
  UserCoinItemLogSchema,
} from './user-coin-item-log.schema';
import { MetaAttributeSchema } from './meta-attribute.schema';

export enum UserCoinItemStatusEnum {
  INVENTORY = 'inventory',
  SOLD = 'sold',
  INVALID = 'invalid',
  LOST = 'lost',
}

@Schema({
  versionKey: false,
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
export class UserCoinItem extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin', required: false })
  coin: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: String,
    enum: UserCoinItemStatusEnum,
    default: UserCoinItemStatusEnum.INVENTORY,
  })
  status: UserCoinItemStatusEnum;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  condition: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Grade', default: null })
  grade: Types.ObjectId;

  @Prop({ type: Date, required: true })
  addedAt: Date;

  @Prop({ type: Boolean, default: true })
  inInventory: boolean;

  @Prop({
    type: String,
    enum: InventoryVisibilityEnum,
    default: InventoryVisibilityEnum.ALL,
  })
  visibility: InventoryVisibilityEnum = InventoryVisibilityEnum.ALL;

  @Prop({ type: [UserCoinItemLogSchema], default: [] })
  actions: UserCoinItemLog[];

  @Prop({ type: [MetaAttributeSchema], ref: 'MetaAttribute', default: [] })
  attributes: any[];

  @Prop({ type: String, default: null })
  comment: string;

  @Prop({ type: Boolean, default: false })
  approved: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  approvedAt: Date;
}

export type UserCoinItemDocument = HydratedDocument<UserCoinItem>;
export const UserCoinItemSchema = SchemaFactory.createForClass(UserCoinItem);

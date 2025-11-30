import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';
import {
  DealMessageLog,
  DealMessageLogSchema,
} from './deal-message-log.schema';

export enum DealModeEnum {
  GUARANTEED = 'guaranteed',
  DIRECT = 'direct',
}

export enum DealStatusEnum {
  PENDING_SELLER = 'pending_seller',
  SELLER_STARTED = 'seller_started',
  GUARANTEE_PENDING = 'guarantee_pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  AWAITING_DELIVERY = 'awaiting_delivery',
  AWAITING_ACCEPTANCE = 'awaiting_acceptance',
  READY_TO_CLOSE = 'ready_to_close',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  DISPUTE = 'dispute',
}

export { DealStatusEnum as DealTypeEnum };

export enum DealItemStatusEnum {
  PENDING = 'pending',
  RESERVED = 'reserved',
  TRANSFERRED = 'transferred',
  SETTLED = 'settled',
}

export enum DealCounterOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  AUTO_ACCEPTED = 'auto_accepted',
  EXPIRED = 'expired',
}

@Schema({ _id: false })
export class DealItemSnapshot {
  @Prop({ type: Object })
  coin: Record<string, any>;

  @Prop({ type: Object })
  userItem: Record<string, any>;
}

export const DealItemSnapshotSchema =
  SchemaFactory.createForClass(DealItemSnapshot);

@Schema({ _id: false })
export class DealItem {
  @Prop({ type: Types.ObjectId, ref: 'UserCoinItem', required: true })
  itemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin', required: true })
  coinId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: false })
  conditionId?: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: String,
    enum: DealItemStatusEnum,
    default: DealItemStatusEnum.PENDING,
  })
  status: DealItemStatusEnum;

  @Prop({ type: Date, default: null })
  settledAt: Date | null;

  @Prop({ type: DealItemSnapshotSchema, default: null })
  snapshot: DealItemSnapshot | null;
}

export const DealItemSchema = SchemaFactory.createForClass(DealItem);

@Schema({ _id: false })
export class DealGuaranteeMeta {
  @Prop({ type: Boolean, default: false })
  enabled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  initiatedBy: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  sellerApproved: boolean;

  @Prop({ type: Boolean, default: false })
  buyerApproved: boolean;

  @Prop({ type: Date, default: null })
  sellerApprovedAt: Date | null;

  @Prop({ type: Date, default: null })
  buyerApprovedAt: Date | null;

  @Prop({ type: Date, default: null })
  autoCancelAt: Date | null;
}

export const DealGuaranteeMetaSchema =
  SchemaFactory.createForClass(DealGuaranteeMeta);

@Schema({ _id: false })
export class DealStageState {
  @Prop({ type: Boolean, default: false })
  done: boolean;

  @Prop({ type: Date, default: null })
  doneAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  confirmedBy: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  note: string | null;
}

export const DealStageStateSchema =
  SchemaFactory.createForClass(DealStageState);

@Schema({ _id: false })
export class DealConfirmations {
  @Prop({ type: DealStageStateSchema, default: () => ({}) })
  buyer: DealStageState;

  @Prop({ type: DealStageStateSchema, default: () => ({}) })
  seller: DealStageState;
}

export const DealConfirmationsSchema =
  SchemaFactory.createForClass(DealConfirmations);

@Schema({ _id: false })
export class DealDisputeMeta {
  @Prop({ type: Boolean, default: false })
  isOpen: boolean;

  @Prop({ type: String, default: null })
  reason: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  openedBy: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  resolution: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: String, default: null })
  adminComment: string | null;
}

export const DealDisputeMetaSchema =
  SchemaFactory.createForClass(DealDisputeMeta);

@Schema({ _id: false })
export class DealChatSummary {
  @Prop({ type: Number, default: 0 })
  totalMessages: number;

  @Prop({ type: Number, default: 0 })
  buyerUnread: number;

  @Prop({ type: Number, default: 0 })
  sellerUnread: number;

  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null;
}

export const DealChatSummarySchema =
  SchemaFactory.createForClass(DealChatSummary);

@Schema()
export class DealCounterOffer extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: String,
    enum: DealCounterOfferStatus,
    default: DealCounterOfferStatus.PENDING,
  })
  status: DealCounterOfferStatus;

  @Prop({ type: String, default: null })
  message: string | null;

  @Prop({
    type: [
      {
        itemId: { type: Types.ObjectId, ref: 'UserCoinItem' },
        price: Number,
      },
    ],
    default: [],
  })
  items: {
    itemId: Types.ObjectId;
    price: number;
  }[];
}

export const DealCounterOfferSchema =
  SchemaFactory.createForClass(DealCounterOffer);

@Schema({ _id: false })
export class DealTimelineEntry {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Date, default: Date.now })
  happenedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actor: Types.ObjectId | null;

  @Prop({ type: Object, default: null })
  payload: Record<string, any> | null;
}

export const DealTimelineEntrySchema =
  SchemaFactory.createForClass(DealTimelineEntry);

@Schema({ versionKey: false, timestamps: true })
export class Deal extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'UserCoinItem', required: false })
  item?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin', required: false })
  coin?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Auction',
    required: false,
    unique: true,
    sparse: true,
    index: true,
  })
  auction?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  buyer?: Types.ObjectId;

  @Prop({
    type: String,
    enum: DealModeEnum,
    default: DealModeEnum.DIRECT,
  })
  mode: DealModeEnum;

  @Prop({
    type: String,
    enum: DealStatusEnum,
    default: DealStatusEnum.PENDING_SELLER,
  })
  status: DealStatusEnum;

  @Prop({ type: [DealItemSchema], default: [] })
  items: DealItem[];

  @Prop({ type: Number, required: true })
  startingPrice: number;

  @Prop({ type: Number, default: null })
  finalPrice: number | null;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: false })
  condition?: Types.ObjectId;

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

  @Prop({ type: DealGuaranteeMetaSchema, default: () => ({ enabled: false }) })
  guarantee: DealGuaranteeMeta;

  @Prop({ type: DealConfirmationsSchema, default: () => ({}) })
  confirmations: DealConfirmations;

  @Prop({ type: DealDisputeMetaSchema, default: () => ({ isOpen: false }) })
  dispute: DealDisputeMeta;

  @Prop({ type: [DealCounterOfferSchema], default: [] })
  counterOffers: DealCounterOffer[];

  @Prop({
    type: DealChatSummarySchema,
    default: () => ({
      totalMessages: 0,
      buyerUnread: 0,
      sellerUnread: 0,
      lastMessageAt: null,
    }),
  })
  chat: DealChatSummary;

  @Prop({ type: [DealTimelineEntrySchema], default: [] })
  timeline: DealTimelineEntry[];

  @Prop({ type: [DealMessageLogSchema], default: [] })
  messages: DealMessageLog[];

  @Prop({ type: Date, default: null })
  autoCancelAt: Date | null;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;
}

export type DealDocument = HydratedDocument<Deal>;
export const DealSchema = SchemaFactory.createForClass(Deal);

DealSchema.index({ auction: 1 }, { unique: true, sparse: true });
DealSchema.index({ seller: 1, status: 1 });
DealSchema.index({ buyer: 1, status: 1 });
DealSchema.index({ mode: 1, status: 1 });

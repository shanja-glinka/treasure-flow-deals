import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MessageReaction } from '../common/enums/message-reactions';
import { UserShortData } from './user.schema';

@Schema({ _id: false, versionKey: false })
export class DealMessageReactionLog {
  @Prop({ type: String, enum: MessageReaction, required: true })
  reaction: MessageReaction;

  @Prop({ type: Object, required: true })
  user: UserShortData;

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;
}

export const DealMessageReactionLogSchema = SchemaFactory.createForClass(
  DealMessageReactionLog,
);

@Schema({ _id: false, versionKey: false })
export class DealMessageLog {
  @Prop({ type: Number, required: true })
  id: number;

  @Prop({ type: Object, required: true })
  user: UserShortData;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({
    type: [DealMessageReactionLogSchema],
    default: () => [],
  })
  reactions: DealMessageReactionLog[];
}

export type DealMessageLogDocument = HydratedDocument<DealMessageLog>;
export const DealMessageLogSchema =
  SchemaFactory.createForClass(DealMessageLog);

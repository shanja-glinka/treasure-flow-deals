import {
  SocketEventDealFinished,
  SocketEventDealMessageReaction,
  SocketEventDealUpdated,
} from '@root/src/app/core/constants';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { DealMessageLogDocument } from '@root/src/app/core/schemas/deal-message-log.schema';
import { Types } from 'mongoose';

export enum NotificationType {
  DEAL_UPDATED = SocketEventDealUpdated,
  DEAL_FINISHED = SocketEventDealFinished,
  DEAL_MESSAGE_REACTION = SocketEventDealMessageReaction,
}

export class DealRoomNotificationEvent {
  roomId: string | Types.ObjectId;
  type: NotificationType;
  auction: DealDocument;
}

export class DealMessageNotificationEvent {
  roomId: string | Types.ObjectId;
  type: NotificationType;
  message: DealMessageLogDocument;
}

export class DealUserNotificationEvent {
  userId: string | Types.ObjectId;
  type: NotificationType | string;
  payload: any;
}

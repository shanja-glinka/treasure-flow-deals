import {
  NotificationChannelEnum,
  NotificationEventKey,
} from '@root/src/app/core/enums';
import { UserDocument } from '@root/src/app/core/schemas/user.schema';
import { Types } from 'mongoose';

export enum NotificationTypeEnum {
  MESSAGE = 'message',
  REMIND = 'remind',
  HOT = 'hot',
}

export type NotificationMetadataType = {
  serviceSource?: 'deal';
  entityTarget?: 'user' | 'seller';
};

export class NotificationDocument {
  userId: string;
  type: NotificationTypeEnum = NotificationTypeEnum.MESSAGE;
  service: string = 'deals';
  channel?: NotificationChannelEnum;
  eventKey: NotificationEventKey;
  title: string;
  text?: string;
  link?: string;
  isRead?: boolean = false;
  readAt?: Date;
  user?: Types.ObjectId;
  author?: Types.ObjectId;
  metadata: NotificationMetadataType;
}

export class NotificationEvent {
  constructor(
    public readonly notification: NotificationDocument,
    public readonly user: UserDocument = null,
    public readonly author: UserDocument = null,
  ) {}
}

import { Types } from 'mongoose';
import { MessageReaction } from '../common/enums/message-reactions';
import { Bid } from './bid.schema';
import { MetaAttribute } from './meta-attribute.schema';
import { UserShortData } from './user.schema';

export class AuctionMessageReactions {
  reaction: MessageReaction;
  user: UserShortData;
  addedAt: Date;
}

export class AuctionMessageLog {
  id: number;
  user: UserShortData;
  message: string;
  createdAt: Date;
  reactions: AuctionMessageReactions[];
}

export enum AuctionTypeEnum {
  PLANNED = 'planned',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export class Auction {
  _id?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;

  title: string;

  description: string | null;

  item: Types.ObjectId;
  items: Types.ObjectId[];

  seller: Types.ObjectId;

  startingPrice: number;

  currentPrice: number | null;

  step: number;

  status: AuctionTypeEnum;

  startAt: Date | null;

  endAt: Date;

  startedAt: Date | null;

  paidAt: Date | null;

  endedAt: Date | null;

  winner: Types.ObjectId | null;

  bids: Bid[];

  attributes: MetaAttribute[];

  messages: AuctionMessageLog[];

  views: number;

  interestViews: number;

  interestBids: number;
}

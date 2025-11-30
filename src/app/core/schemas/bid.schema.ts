import { Types } from 'mongoose';
import { UserShortData } from './user.schema';

export class Bid {
  auction: Types.ObjectId;
  user: UserShortData;
  amount: number;
  confirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

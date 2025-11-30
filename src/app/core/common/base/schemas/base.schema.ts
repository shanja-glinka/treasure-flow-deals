import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class BaseSchema {
  _id?: Types.ObjectId;

  @Prop({ type: Date, required: false, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  updatedAt: Date;
}

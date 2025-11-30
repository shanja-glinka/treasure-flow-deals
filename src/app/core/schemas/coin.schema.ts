import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';
import { MetaAttributeSchema } from './meta-attribute.schema';

export enum CoinStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CoinShape {
  ROUND = 'round',
  OVAL = 'oval',
  RECTANGLE = 'rectangle',
  SQUARE = 'square',
  POLYGON = 'polygon',
  IRREGULAR = 'irregular',
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
export class Coin extends BaseSchema {
  @Prop({ type: String, default: null })
  slug: string | null;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: CoinStatus, default: CoinStatus.DRAFT })
  status: CoinStatus;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: Number, default: null })
  year: number;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', default: null })
  rarity: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  country: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  material: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  category: Types.ObjectId;

  @Prop({ type: Number, default: null })
  weight: number;

  @Prop({ type: Number, default: null })
  diameter: number;

  @Prop({ type: Number, default: null })
  thickness: number;

  @Prop({ type: Number, default: null })
  edges: number;

  @Prop({ type: String, enum: CoinShape, default: CoinShape.ROUND })
  shape: CoinShape;

  @Prop({ type: Number, default: null })
  mintage: number;

  @Prop({ type: Number, default: null })
  price: number;

  @Prop({ type: Number, default: null })
  interest: number;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [MetaAttributeSchema], default: [] })
  attributes: any[];

  @Prop({ type: String, default: null })
  proofedBy: string | null;

  @Prop({ type: Date, default: null })
  proofedAt: Date | null;

  @Prop({ type: [String], default: [] })
  imagesObverse: string[];

  @Prop({ type: [String], default: [] })
  imagesReverse: string[];
}

export type CoinDocument = HydratedDocument<Coin>;
export const CoinSchema = SchemaFactory.createForClass(Coin);

// Virtual for attachments
CoinSchema.virtual('attachmentsFiles', {
  ref: 'File',
  localField: 'attachments',
  foreignField: 'fileId',
  justOne: false,
});

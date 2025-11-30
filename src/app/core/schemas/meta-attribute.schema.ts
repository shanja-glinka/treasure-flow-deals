import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';
import { CoinAttributeTypeEnum } from '../enums';
import { Dictionary } from './dictionary.schema';

@Schema({
  versionKey: false,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MetaAttribute extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: Dictionary.name,
    required: true,
    index: true,
  })
  dictionary: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
    sparse: true,
    index: true,
  })
  value: string | null;

  @Prop({
    type: Number,
    default: null,
    index: true,
  })
  unit: number | null;

  @Prop({ type: Number, default: null })
  unitTo: number | null;

  @Prop({
    type: String,
    enum: CoinAttributeTypeEnum,
    default: CoinAttributeTypeEnum.ANY,
    index: true,
  })
  measure: CoinAttributeTypeEnum | null;

  @Prop({
    type: [Types.ObjectId],
    required: true,
    default: [],
  })
  coinId: Types.ObjectId[];
}

export type MetaAttributeDocument = HydratedDocument<MetaAttribute>;

export const MetaAttributeSchema = SchemaFactory.createForClass(MetaAttribute);

// CoinAttributeSchema.index({ dictionary: 1, coinId: 1 });
MetaAttributeSchema.index({ measure: 1, unit: 1 });

MetaAttributeSchema.virtual('dictionaryInfo', {
  ref: Dictionary.name,
  localField: 'dictionary',
  foreignField: '_id',
  justOne: true,
});

MetaAttributeSchema.pre('find', function () {
  if (
    this.getQuery().dictionary &&
    typeof this.getQuery().dictionary === 'string'
  ) {
    this.setQuery({
      ...this.getQuery(),
      dictionary: new Types.ObjectId(this.getQuery().dictionary),
    });
  }
});

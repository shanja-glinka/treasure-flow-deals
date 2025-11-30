import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../common/base/schemas/base.schema';

@Schema({
  versionKey: false,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Dictionary extends BaseSchema {
  @Prop({ type: String, required: true, index: true })
  group: string;

  @Prop({ type: String, required: true, index: true })
  type: string;

  @Prop({ type: String, required: true, unique: true })
  slug: string;

  @Prop({ type: String, required: true, index: true })
  title: string;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: Number, default: null, index: true })
  order: number | null;
}

export type DictionaryDocument = HydratedDocument<Dictionary>;
export const DictionarySchema = SchemaFactory.createForClass(Dictionary);

// Составной индекс для частых запросов по group и type
DictionarySchema.index({ group: 1, type: 1 }, { unique: true });

// Составной индекс для сортировки по группе и порядку
DictionarySchema.index({ group: 1, order: 1 });

// Проверяет, если поле 'slug' пустое, то заполняет его значением 'group' + '_' + 'type'.
DictionarySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = `${this.group}_${this.type}`;
  }
  next();
});

// Хук генерирует значение 'slug' при каждом обновлении документа, если 'group' и 'type' обновляются.
DictionarySchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate'],
  function (next) {
    const update = this.getUpdate() as Record<string, any>;

    // Если используется $set (что является наиболее распространенным способом обновления),
    // и поля 'group' и 'type' присутствуют в обновлении, то генерируем новый 'slug'.
    if (update.$set && update.$set.group && update.$set.type) {
      update.$set.slug = `${update.$set.group}_${update.$set.type}`;
    }
    // Для других случаев обновления, где используется 'group' и 'type' напрямую.
    else if (update.group && update.type) {
      update.slug = `${update.group}_${update.type}`;
    }

    next();
  },
);

// Добавляем предобработку для запросов, которая конвертирует строковые значения в нужные типы
DictionarySchema.pre('find', function () {
  const query = this.getQuery();
  // Проверка на $in для полей group и type
  if (query.group && query.group.$in && Array.isArray(query.group.$in)) {
    // Конвертируем все элементы $in в строки (если необходимо)
    query.group.$in = query.group.$in.map((item) => String(item));
  }

  if (query.type && query.type.$in && Array.isArray(query.type.$in)) {
    // Конвертируем все элементы $in в строки (если необходимо)
    query.type.$in = query.type.$in.map((item) => String(item));
  }
});

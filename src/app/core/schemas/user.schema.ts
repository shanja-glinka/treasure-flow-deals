import { model, Schema } from 'mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  SELLER = 'seller',
  //...
}

export class UserShortData {
  _id: Types.ObjectId;
  username: string;
  email: string;
  imageId?: string | null;
  roles?: Role[];
}

export class User {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  surname: string;
  email: string;
  password: string;
  emailVerifiedAt: Date | null;
  roles: Role[];
  imageId?: string | null;
  coinLogs: Types.ObjectId[];
}

// "Пассивная" схема, которая только читает данные из коллекции
export const UserSchema = new Schema(
  {
    _id: { type: Types.ObjectId },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    name: { type: String },
    surname: { type: String },
    imageId: { type: String },
    email: { type: String },
    password: { type: String },
    emailVerifiedAt: { type: Date },
    roles: [{ type: String, enum: Object.values(Role) }],
    coinLogs: [{ type: Types.ObjectId, ref: 'UserCoinItem' }],
  },
  {
    versionKey: false, // Отключаем поле __v
  },
);

// Преобразование данных при возврате JSON
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password; // Удаляем пароль
    ret.id = ret._id; // Преобразуем _id в id
    delete ret._id; // Удаляем оригинальное поле _id
    return ret;
  },
});

// Тип документа
export type UserDocument = HydratedDocument<User>;
export const UserModel = model<UserDocument>(User.name, UserSchema);

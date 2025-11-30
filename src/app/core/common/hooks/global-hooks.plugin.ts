import { Schema } from 'mongoose';

export const globalUpdateAtHook = (schema: Schema): void => {
  // Хук для обновления `updatedAt` на всех методах обновления
  schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    this.set({ updatedAt: new Date() });
    next();
  });
};

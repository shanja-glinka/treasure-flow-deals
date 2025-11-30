import { FilterQuery } from 'mongoose';

export class WhereFilterHelper {
  /**
   * Генерирует фильтр для проверки верификации пользователя.
   * @param where - Основной объект фильтрации.
   * @param isValidated - Указывает, нужно ли фильтровать по верифицированным (по умолчанию `true`).
   * @returns Фильтр для использования в Mongoose.
   */
  static verifiedUserFilter<T>(
    where: FilterQuery<T>,
    isValidated = true,
  ): FilterQuery<T> {
    return {
      ...where,
      emailVerifiedAt: isValidated
        ? { $exists: true, $ne: null } // Поле должно существовать и быть не null
        : { $or: [{ $exists: false }, { $eq: null }] }, // Либо отсутствует, либо равно null
    };
  }
}

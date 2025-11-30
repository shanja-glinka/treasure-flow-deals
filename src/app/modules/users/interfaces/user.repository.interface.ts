import { UserDocument } from '@root/src/app/core/schemas/user.schema';

export interface IUserRepository {
  /**
   * Находит пользователя по фильтру.
   *
   * @param filter - Фильтр поиска.
   * @returns Документ пользователя.
   */
  findOneBy(filter: any): Promise<UserDocument | null>;
}

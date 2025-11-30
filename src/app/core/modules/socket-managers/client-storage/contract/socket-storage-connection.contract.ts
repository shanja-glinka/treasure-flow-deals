export interface ISocketStorageConnectionRepository {
  /**
   * Возвращает количество сокетов для указанного пользователя
   * @param userId - ID пользователя
   * @returns количество сокетов для указанного пользователя
   */
  size(userId: string): number;

  /**
   * Добавляет сокет в список подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  push(userId: string, socketId: string): void;

  /**
   * Удаляет сокет из списка подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  shift(userId: string): string | null;

  /**
   * Получает userId по socketId
   *
   * @param clientId ID сокета
   * @returns userId или null, если сокет не связан с пользователем
   */
  getUserId(clientId: string): string | null;

  /**
   * Добавляет сокет в список подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  getSockets(userId: string): string[];

  /**
   * Удаляет сокет из списка подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  removeUserSocket(userId: string, socketId: string): void;

  /**
   * Получает текущий активный socketId пользователя
   * Возвращает последний (самый новый) socketId из массива соединений пользователя
   *
   * @param userId ID пользователя
   * @returns socketId или null, если пользователь не в сети
   */
  getLatestSocket(userId: string): string | null;

  /**
   * Проверяет, активен ли указанный socketId
   *
   * @param socketId ID сокета для проверки
   * @returns true если сокет активен, false в противном случае
   */
  isSocketActive(socketId: string): boolean;
}

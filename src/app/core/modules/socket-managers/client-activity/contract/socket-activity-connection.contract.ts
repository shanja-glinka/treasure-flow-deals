export interface ISocketActivityConnectionClient {
  userId: string;
  socketId: string;
  roomFilerId?: string;
}

export interface ISocketActivityConnectionRepository {
  /**
   * Устанавливает метку времени последней активности для пользователя
   * @param client - объект с данными пользователя и комнаты
   * @param inactivityTimeout - таймаут неактивности в миллисекундах
   * @param callback - функция, которая будет вызвана при обнаружении неактивности
   */
  setActivity(
    client: ISocketActivityConnectionClient,
    inactivityTimeout: number,
    callback: () => void,
  ): void;

  /**
   * Возвращает ключ для пользователя и комнаты
   * @param client - объект с данными пользователя и комнаты
   * @returns ключ
   */
  key(client: ISocketActivityConnectionClient): string | null;

  /**
   * Проверяет, является ли пользователь неактивным
   * @param key - ключ
   * @param timeout - таймаут
   * @returns true, если пользователь неактивный, иначе false
   */
  isInactive(key: string, timeout: number): boolean;

  /**
   * Удаляет пользователя из списка активных пользователей
   * @param client - объект с данными пользователя и комнаты
   */
  inactivate(client: ISocketActivityConnectionClient): void;
}

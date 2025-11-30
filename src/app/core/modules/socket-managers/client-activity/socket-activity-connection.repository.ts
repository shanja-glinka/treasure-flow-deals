import { ISocketActivityConnectionClient } from './contract/socket-activity-connection.contract';
import { Injectable, Logger } from '@nestjs/common';
import { ISocketActivityConnectionRepository } from './../client-activity/contract/socket-activity-connection.contract';

/**
 * Сервис для управления активностью пользователей через сокеты.
 *
 * Класс отвечает за:
 * - Отслеживание времени последней активности пользователей.
 * - Регистрацию и удаление обработчиков неактивности.
 * - Проверку неактивности пользователей и вызов соответствующих колбеков.
 *
 * Использует Map для хранения информации о пользователях и их активности,
 * что позволяет эффективно управлять состоянием подключений.
 */
@Injectable()
export class SocketActivityConnectionRepository
  implements ISocketActivityConnectionRepository
{
  private readonly logger = new Logger(SocketActivityConnectionRepository.name);

  /**
   * Map для хранения подключения: для каждого userId хранится массив socket.id,
   * что позволяет ограничивать общее число подключений для данного пользователя.
   */
  protected userActivity = new Map<string, number>();

  /**
   * Реестр обработчиков неактивности
   * Ключи формируются как `${socketId}`, значения содержат информацию для проверки неактивности
   */
  protected inactivityHandlers = new Map<
    string,
    {
      userId: string;
      roomFilerId: string;
      timeout: number;
      callback: () => void;
    }
  >();

  constructor() {
    // Запускаем фоновую проверку неактивности
    this.startInactivityChecks();
  }

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
  ): void {
    const { userId, socketId, roomFilerId } = client;
    const key = this.generateKey(client);

    this.userActivity.set(key, Date.now());

    // Удаляем существующий обработчик, если он есть
    this.removeInactivityHandler(socketId);

    // Сохраняем информацию об обработчике
    this.inactivityHandlers.set(socketId, {
      userId,
      roomFilerId,
      timeout: inactivityTimeout,
      callback,
    });

    this.logger.debug(
      `Зарегистрирован обработчик неактивности для сокета ${socketId} (userId=${userId}, roomFilerId=${roomFilerId})`,
    );
  }

  /**
   * Возвращает ключ для пользователя и комнаты
   * @param userId - ID пользователя
   * @param roomFilerId - ID комнаты
   * @returns ключ
   */
  key(client: ISocketActivityConnectionClient): string | null {
    const key = this.generateKey(client);
    return this.userActivity.has(key) ? key : null;
  }

  /**
   * Проверяет, является ли пользователь неактивным
   * @param key - ключ
   * @param timeout - таймаут в миллисекундах
   * @returns true, если пользователь неактивный, иначе false
   */
  isInactive(key: string, timeout: number): boolean {
    const last = this.userActivity.get(key);
    if (!last) return false;
    const diff = Date.now() - last;
    return diff >= timeout;
  }

  /**
   * Удаляет пользователя из списка активных пользователей
   * @param client - объект с данными пользователя и комнаты
   */
  inactivate(client: ISocketActivityConnectionClient): void {
    const key = this.generateKey(client);
    const socketId = client.socketId;
    this.removeInactivityHandler(socketId);
    this.userActivity.delete(key);
  }

  /**
   * Удаляет обработчик неактивности для указанного сокета
   * @param socketId - ID сокета
   */
  private removeInactivityHandler(socketId: string): void {
    if (this.inactivityHandlers.has(socketId)) {
      this.inactivityHandlers.delete(socketId);
      this.logger.debug(
        `Удален обработчик неактивности для сокета ${socketId}`,
      );
    }
  }

  /**
   * Запускает фоновую проверку неактивности всех зарегистрированных пользователей
   * Проверяет каждый сокет раз в 30 секунд
   */
  private startInactivityChecks(): void {
    // Запускаем проверку неактивности с интервалом 30 секунд
    setInterval(() => {
      this.checkInactivity();
    }, 60 * 1000); // 60 секунд
  }

  /**
   * Проверяет неактивность всех зарегистрированных пользователей
   */
  private checkInactivity(): void {
    // Обходим все зарегистрированные обработчики неактивности
    for (const [socketId, handler] of this.inactivityHandlers.entries()) {
      const { userId, roomFilerId, timeout, callback } = handler;
      const activityKey = this.key({ userId, roomFilerId, socketId });

      // Если ключ активности существует и пользователь неактивен
      if (activityKey && this.isInactive(activityKey, timeout)) {
        try {
          // Удаляем обработчик перед вызовом колбека, чтобы избежать повторного вызова
          this.removeInactivityHandler(socketId);

          // Помечаем пользователя как неактивного
          this.inactivate({ userId, roomFilerId, socketId });

          // Вызываем колбек
          this.logger.debug(
            `Обнаружена неактивность для сокета ${socketId} (userId=${userId}, roomFilerId=${roomFilerId})`,
          );
          callback();
        } catch (error) {
          this.logger.error(
            `Ошибка при обработке неактивности для сокета ${socketId}: ${error.message}`,
            error.stack,
          );
        }
      }
    }
  }

  /**
   * Генерирует ключ для пользователя и комнаты
   * @param userId - ID пользователя
   * @param roomFilerId - ID комнаты
   * @returns ключ
   */
  private generateKey(client: ISocketActivityConnectionClient): string {
    const { socketId } = client;
    return `${socketId}`;
    // return `${userId}_${socketId}`;
  }
}

import { Injectable } from '@nestjs/common';
import { ISocketStorageConnectionRepository } from './contract/socket-storage-connection.contract';

/**
 * Сервис для доступа к информации о соединениях пользователей
 * Использует существующий механизм userSockets из SocketGatewayManager
 */
@Injectable()
export class SocketStorageConnectionRepository
  implements ISocketStorageConnectionRepository
{
  /**
   * Map для хранения подключения: для каждого userId хранится массив socket.id,
   * что позволяет ограничивать общее число подключений для данного пользователя.
   */
  protected userSockets = new Map<string, string[]>();

  constructor() {}

  /**
   * Возвращает количество сокетов для указанного пользователя
   * @param userId - ID пользователя
   * @returns количество сокетов для указанного пользователя
   */
  size(userId: string): number {
    return this.userSockets.has(userId)
      ? this.userSockets.get(userId).length
      : 0;
  }

  /**
   * Добавляет сокет в список подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  push(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) || [];
    this.userSockets.set(userId, [...sockets, socketId]);
  }

  /**
   * Удаляет сокет из списка подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  shift(userId: string): string | null {
    const sockets = this.userSockets.get(userId) || [];
    return sockets.shift();
  }

  /**
   * Получает userId по socketId
   *
   * @param clientId ID сокета
   * @returns userId или null, если сокет не связан с пользователем
   */
  getUserId(clientId: string): string | null {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.includes(clientId)) {
        return userId;
      }
    }
    return null;
  }

  /**
   * Добавляет сокет в список подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  getSockets(userId: string): string[] {
    return this.userSockets.has(userId) ? this.userSockets.get(userId) : [];
  }

  /**
   * Удаляет сокет из списка подключений пользователя
   * @param userId - ID пользователя
   * @param socketId - ID сокета
   */
  removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const idx = sockets.indexOf(socketId);
      if (idx >= 0) {
        sockets.splice(idx, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Получает текущий активный socketId пользователя
   * Возвращает последний (самый новый) socketId из массива соединений пользователя
   *
   * @param userId ID пользователя
   * @returns socketId или null, если пользователь не в сети
   */
  getLatestSocket(userId: string): string | null {
    // Получаем массив сокетов пользователя из встроенного механизма хранения SocketGatewayManager
    const sockets = this.userSockets.get(userId);

    // Если массив существует и не пустой, возвращаем последний (самый новый) socketId
    if (sockets && sockets.length > 0) {
      return sockets[sockets.length - 1];
    }

    return null;
  }

  /**
   * Проверяет, активен ли указанный socketId
   *
   * @param socketId ID сокета для проверки
   * @returns true если сокет активен, false в противном случае
   */
  isSocketActive(socketId: string): boolean {
    const userId = this.getUserId(socketId);
    return !!userId;
  }
}

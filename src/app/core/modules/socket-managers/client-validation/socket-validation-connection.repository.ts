import { Injectable, Logger } from '@nestjs/common';
import {
  ISocketValidationConnectionClient,
  ISocketValidationConnectionRepository,
} from './contract/socket-validation-connection.contract';

/**
 * Интерфейс для данных сокета
 * @internal
 */
interface SocketData {
  onInvalidCallback: () => void;
  roomFilerId?: string;
}

/**
 * Интерфейс для данных валидации пользователя
 * @internal
 */
interface UserValidationData {
  validationCallback: () => Promise<boolean>;
  socketData: Map<string, SocketData>; // socketId -> SocketData
  interval: number;
  payload?: any;
}

/**
 * Сервис для управления валидацией пользователей через сокеты.
 *
 * Класс отвечает за:
 * - Периодическую валидацию состояния пользователей.
 * - Проверку статуса пользователя ОДИН раз, независимо от количества его сокетов.
 * - Вызов onInvalidCallback для каждого сокета при неудачной валидации.
 * - Управление таймерами валидации для оптимизации ресурсов.
 *
 * Использует карты для хранения информации о валидаторах и соответствия сокетов пользователям,
 * что позволяет эффективно управлять состоянием подключений.
 */
@Injectable()
export class SocketValidationConnectionRepository
  implements ISocketValidationConnectionRepository
{
  private readonly logger = new Logger(
    SocketValidationConnectionRepository.name,
  );

  /**
   * Реестр таймеров для валидации пользователей.
   * Ключи формируются как `${userId}`, каждый userId имеет один таймер валидации.
   */
  private readonly validationTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Реестр данных валидации пользователей.
   * Ключи формируются как `${userId}`, значения содержат функцию валидации и данные сокетов.
   */
  private readonly validationData = new Map<string, UserValidationData>();

  /**
   * Карта соответствия socketId -> userId для быстрого поиска пользователя по сокету.
   */
  private readonly socketToUser = new Map<string, string>();

  /**
   * Регистрирует клиента для валидации
   * @param client - объект с данными пользователя, сокета и полезной нагрузкой
   * @param validationInterval - интервал валидации в миллисекундах
   * @param validationCallback - функция валидации, которая будет вызываться периодически
   * @param onInvalidCallback - функция, вызываемая для каждого сокета при неудачной валидации
   */
  registerForValidation(
    client: ISocketValidationConnectionClient,
    validationInterval: number,
    validationCallback: () => Promise<boolean>,
    onInvalidCallback: () => void,
  ): void {
    const { userId, socketId, roomFilerId, payload } = client;

    // Связываем socketId с userId для быстрого поиска
    this.socketToUser.set(socketId, userId);

    // Получаем или создаем данные валидации для пользователя
    let userData = this.validationData.get(userId);

    if (!userData) {
      // Создаем новые данные валидации для пользователя
      userData = {
        validationCallback,
        socketData: new Map<string, SocketData>(),
        interval: validationInterval,
        payload,
      };
      this.validationData.set(userId, userData);

      this.logger.debug(
        `Создан новый валидатор для пользователя ${userId} с интервалом ${validationInterval}ms`,
      );
    } else {
      // Обновляем параметры существующего валидатора
      userData.validationCallback = validationCallback; // Используем последнюю функцию валидации
      userData.payload = payload;
      userData.interval = validationInterval;
    }

    // Запускаем или перезапускаем таймер валидации
    this.startValidationTimer(userId);

    // Сохраняем данные сокета
    userData.socketData.set(socketId, {
      onInvalidCallback,
      roomFilerId,
    });

    this.logger.debug(
      `Зарегистрирован сокет ${socketId} для валидации пользователя ${userId}. Всего сокетов: ${userData.socketData.size}`,
    );
  }

  /**
   * Отменяет регистрацию клиента для валидации
   * @param socketId - ID сокета
   */
  unregisterFromValidation(socketId: string): void {
    // Получаем userId по socketId
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return;
    }

    // Удаляем связь socketId -> userId
    this.socketToUser.delete(socketId);

    // Получаем данные валидации пользователя
    const userData = this.validationData.get(userId);
    if (!userData) {
      return;
    }

    // Удаляем сокет из данных пользователя
    userData.socketData.delete(socketId);

    this.logger.debug(
      `Удален сокет ${socketId} из валидатора пользователя ${userId}. Осталось сокетов: ${userData.socketData.size}`,
    );

    // Если у пользователя не осталось сокетов, удаляем данные валидации и таймер
    if (userData.socketData.size === 0) {
      this.clearValidationTimer(userId);
      this.validationData.delete(userId);
      this.logger.debug(
        `Удален валидатор для пользователя ${userId}, т.к. не осталось активных сокетов`,
      );
    }
  }

  /**
   * Запускает таймер валидации для пользователя
   * @param userId - ID пользователя
   */
  private startValidationTimer(userId: string): void {
    // Очищаем существующий таймер, если он есть
    this.clearValidationTimer(userId);

    // Получаем данные валидации пользователя
    const userData = this.validationData.get(userId);
    if (!userData) {
      return;
    }

    // Создаем новый таймер валидации
    const timer = setInterval(() => {
      this.validateUser(userId);
    }, userData.interval);

    // Сохраняем таймер
    this.validationTimers.set(userId, timer);

    this.logger.debug(
      `Запущен таймер валидации для пользователя ${userId} с интервалом ${userData.interval}ms`,
    );
  }

  /**
   * Выполняет валидацию пользователя и вызывает коллбэки при неудаче
   * @param userId - ID пользователя
   */
  private async validateUser(userId: string): Promise<void> {
    // Получаем данные валидации пользователя
    const userData = this.validationData.get(userId);
    if (!userData) {
      // Если данных нет, очищаем таймер на всякий случай
      this.clearValidationTimer(userId);
      return;
    }

    // Если у пользователя нет сокетов, нет смысла проводить валидацию
    if (userData.socketData.size === 0) {
      this.clearValidationTimer(userId);
      this.validationData.delete(userId);
      return;
    }

    try {
      // Выполняем валидацию ОДИН раз для пользователя
      const isValid = await userData.validationCallback();

      // Если валидация пройдена успешно, ничего не делаем
      if (isValid) {
        return;
      }

      // Вызываем onInvalidCallback для всех сокетов пользователя
      this.notifyInvalidCallbacks(userId);
    } catch (error) {
      // При ошибке валидации также вызываем коллбэки
      this.logger.error(
        `Ошибка при валидации пользователя ${userId}: ${error.message}`,
        error.stack,
      );

      this.notifyInvalidCallbacks(userId);
    }
  }

  /**
   * Вызывает коллбэки для всех сокетов пользователя и очищает данные валидации
   * @param userId - ID пользователя
   */
  private notifyInvalidCallbacks(userId: string): void {
    const userData = this.validationData.get(userId);
    if (!userData) {
      return;
    }

    // Создаем копию списка сокетов, чтобы избежать проблем при модификации во время итерации
    const socketEntries = Array.from(userData.socketData.entries());

    // Вызываем onInvalidCallback для каждого сокета
    for (const [socketId, socketData] of socketEntries) {
      try {
        socketData.onInvalidCallback();
        this.logger.debug(
          `Вызван коллбэк неудачной валидации для сокета ${socketId}`,
        );
      } catch (error) {
        this.logger.error(
          `Ошибка при вызове коллбэка для сокета ${socketId}: ${error.message}`,
          error.stack,
        );
      }
    }

    // Очищаем данные валидации и таймер
    this.clearValidationTimer(userId);
    this.validationData.delete(userId);

    // Удаляем все связи socketId -> userId для этого пользователя
    for (const [socketId, mappedUserId] of this.socketToUser.entries()) {
      if (mappedUserId === userId) {
        this.socketToUser.delete(socketId);
      }
    }

    this.logger.debug(
      `Удалены все данные валидации для пользователя ${userId}`,
    );
  }

  /**
   * Очищает таймер валидации для указанного пользователя
   * @param userId - ID пользователя
   */
  private clearValidationTimer(userId: string): void {
    const timer = this.validationTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.validationTimers.delete(userId);
    }
  }
}

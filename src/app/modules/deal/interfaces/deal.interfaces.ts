import { Types } from 'mongoose';
import { AddMessageReactionDto } from '../dto/add-message-reaction.dto';
import { AddMessageDto } from '../dto/add-message.dto';
import {
  DealMessageNotificationEvent,
  DealRoomNotificationEvent,
  DealUserNotificationEvent,
} from '../events/deal-notification.event';

export interface IMessagesService {
  /**
   * Добавляет новое сообщение в указанный аукцион и уведомляет всех пользователей в комнате.
   *
   * @param {AddMessageDto} data - Данные нового сообщения.
   * @returns {Promise<void>} - Промис, который выполняется после добавления сообщения.
   */
  addMessage(data: AddMessageDto): Promise<void>;

  /**
   * Добавляет или изменяет реакцию на конкретное сообщение.
   * Удаляет реакцию, если её тип равен `NotificationType.NONE`.
   * Уведомляет пользователей об изменении через событие `EventAuctionReactionAdded`.
   *
   * @param {AddMessageReactionDto} data - Данные для добавления или изменения реакции.
   * @returns {Promise<void>} - Промис, который выполняется после обработки реакции.
   */
  addReaction(data: AddMessageReactionDto): Promise<void>;
}

export interface INotificationService {
  notifyUser(event: DealUserNotificationEvent): Promise<void>;
  notifyAllInRoom(
    event: DealRoomNotificationEvent | DealMessageNotificationEvent,
  ): Promise<void>;
  notifyUserImportantEvent(event: DealUserNotificationEvent): Promise<void>;
  notifyAll(event: string, data: any): Promise<void>;
}

export interface IDealValidationService {
  /**
   * Валидация пользователя для участия в аукционе (запускается при входе + каждые 10 минут).
   */
  validateUserInDeal(
    dealId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean>;
}

import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepositoryToken } from '@root/src/app/core/constants';
import { IUserRepository } from '@root/src/app/modules/users/interfaces/user.repository.interface';
import { Queue } from 'bull';
import {
  NotificationEvent,
  NotificationTypeEnum,
} from '../event/notification-create.event';
import { QueueProcessorNotification, QueueTaskNotifyUsersBulk } from '../types';
import { NotificationEventKey } from '@root/src/app/core/enums';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue(QueueProcessorNotification)
    private readonly queue: Queue,

    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  notifyUser(eventHandled: NotificationEvent | NotificationEvent[]) {
    this.queue.add(
      QueueTaskNotifyUsersBulk,
      Array.isArray(eventHandled) ? eventHandled : [eventHandled],
    );
  }

  async dealFinished(deal: DealDocument): Promise<void> {
    const sellerId = this.extractUserId(deal.seller);
    const buyerId = this.extractUserId(deal.buyer);
    const finalPrice = deal.finalPrice ?? deal.startingPrice;

    const notifications: NotificationEvent[] = [];

    if (sellerId) {
      const seller = await this.userRepository.findOneBy({ _id: sellerId });
      const event = new NotificationEvent(
        {
          userId: sellerId.toString(),
          type: NotificationTypeEnum.MESSAGE,
          service: 'deal',
          eventKey: NotificationEventKey.DEAL_FINISHED,
          title: 'Сделка завершена',
          text: `Сделка завершена. Итоговая сумма: ${finalPrice}`,
          link: `/deals/${deal._id.toString()}`,
          metadata: {
            serviceSource: 'deal',
            entityTarget: 'seller',
          },
        },
        seller,
        null,
      );
      notifications.push(event);
    }

    if (buyerId) {
      const buyer = await this.userRepository.findOneBy({ _id: buyerId });
      const event = new NotificationEvent(
        {
          userId: buyerId.toString(),
          type: NotificationTypeEnum.MESSAGE,
          service: 'deal',
          eventKey: NotificationEventKey.DEAL_FINISHED,
          title: 'Сделка завершена',
          text: `Сделка завершена. Итоговая сумма: ${finalPrice}`,
          link: `/deals/${deal._id.toString()}`,
          metadata: {
            serviceSource: 'deal',
            entityTarget: 'user',
          },
        },
        buyer,
        null,
      );
      notifications.push(event);
    }

    if (notifications.length) {
      this.notifyUser(notifications);
    }
  }

  /**
   * Извлекает ID пользователя из объекта
   *
   * @param {any} value - Объект с ID пользователя
   * @returns {Types.ObjectId | null} ID пользователя или null
   */
  private extractUserId(value: any): Types.ObjectId | null {
    if (!value) {
      return null;
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    if (value?._id) {
      return this.extractUserId(value._id);
    }

    return null;
  }
}

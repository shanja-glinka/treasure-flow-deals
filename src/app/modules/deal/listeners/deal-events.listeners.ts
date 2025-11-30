import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EventDealChanged,
  EventDealCreated,
  EventDealFinished,
  EventDealMessageAdded,
  EventDealMessageRemoved,
  EventDealReactionAdded,
  EventDealReactionRemoved,
  IDealRepositoryToken,
  INotificationServiceToken,
} from '@root/src/app/core/constants';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import {
  DealMessageNotificationEvent,
  DealRoomNotificationEvent,
} from '../events/deal-notification.event';
import { IDealRepository } from '../interfaces/deal.repository.interface';
import { INotificationService } from '../interfaces/deal.interfaces';
import { NotificationType } from '../events/deal-notification.event';

@Injectable()
export class DealEventsListener {
  private readonly logger = new Logger(DealEventsListener.name);

  public constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,

    @Inject(INotificationServiceToken)
    private readonly notificationService: INotificationService,
  ) {}

  @OnEvent(EventDealChanged, { async: true })
  async handleDealChanged(
    event: DealRoomNotificationEvent | DealMessageNotificationEvent,
  ) {
    await this.notificationService.notifyAllInRoom(event);
    this.logger.log(`Handling handleDealChanged for room ${event.roomId}`);
  }

  @OnEvent(EventDealMessageAdded, { async: true })
  @OnEvent(EventDealMessageRemoved, { async: true })
  @OnEvent(EventDealReactionAdded, { async: true })
  @OnEvent(EventDealReactionRemoved, { async: true })
  async handleDealMessage(
    event: DealRoomNotificationEvent | DealMessageNotificationEvent,
  ) {
    // Рассылаем обновлённую сущность
    await this.notificationService.notifyAllInRoom(event);

    this.logger.log(`Handling ${event.type} for room ${event.roomId}`);
  }

  /**
   * Завершена сделка — уведомим участников комнаты сделки
   */
  @OnEvent(EventDealFinished, { async: true })
  async handleDealFinished(dealOrId: DealDocument | string) {
    try {
      const deal =
        typeof dealOrId === 'string'
          ? await this.dealRepository.findById(dealOrId, true, true)
          : (dealOrId as DealDocument);

      if (!deal) {
        return;
      }

      await this.notificationService.notifyAllInRoom({
        roomId: deal._id,
        type: NotificationType.DEAL_FINISHED,
        deal,
      });
      this.logger.log(`Deal finished notified, room=${deal._id.toString()}`);
    } catch (e) {
      this.logger.error(
        `Failed to notify deal finished for ${dealOrId}`,
        e as any,
      );
    }
  }

  @OnEvent(EventDealCreated, { async: true })
  async handleDealCreated(deal: DealDocument) {
    this.logger.log(`Deal created: ${deal._id}`);
    await this.notificationService.notifyAllInRoom({
      roomId: deal._id,
      type: NotificationType.DEAL_UPDATED,
      deal,
    });
  }
}

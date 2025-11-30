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
  SocketEventDealFinished,
} from '@root/src/app/core/constants';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import {
  DealMessageNotificationEvent,
  DealRoomNotificationEvent,
} from '../events/deal-notification.event';
import { DealGateway } from '../gateway/deal.gateway';
import { IDealRepository } from '../interfaces/deal.repository.interface';

@Injectable()
export class DealEventsListener {
  private readonly logger = new Logger(DealEventsListener.name);

  public constructor(
    private readonly dealGateway: DealGateway,
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,
  ) {}

  @OnEvent(EventDealChanged, { async: true })
  async handleDealChanged(
    event: DealRoomNotificationEvent | DealMessageNotificationEvent,
  ) {
    // Рассылаем обновлённую сущность
    // await this.notificationService.notifyAllInRoom(event);

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
    // await this.notificationService.notifyAllInRoom(event);

    this.logger.log(`Handling ${event.type} for room ${event.roomId}`);
  }

  /**
   * Завершена сделка — уведомим участников комнаты сделки
   */
  @OnEvent(EventDealFinished, { async: true })
  async handleDealFinished(dealId: string) {
    try {
      const deal = await this.dealRepository.findById(dealId, true, true);
      const room = deal?._id?.toString() ?? dealId.toString();
      this.dealGateway.server
        .to(room)
        .emit(SocketEventDealFinished, { data: deal });
      this.logger.log(`Deal finished notified, room=${room}`);
    } catch (e) {
      this.logger.error(
        `Failed to notify deal finished for ${dealId}`,
        e as any,
      );
    }
  }

  @OnEvent(EventDealCreated, { async: true })
  async handleDealCreated(deal: DealDocument) {
    this.logger.log(`Deal created: ${deal._id}`);
  }
}

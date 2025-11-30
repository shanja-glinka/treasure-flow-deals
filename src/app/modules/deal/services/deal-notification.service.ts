import { Injectable } from '@nestjs/common';
import {
  DealMessageNotificationEvent,
  DealRoomNotificationEvent,
  DealUserNotificationEvent,
} from '../events/deal-notification.event';
import { INotificationService } from '../interfaces/deal.interfaces';
import { DealGateway } from '../gateway/deal.gateway';
import { DealViewBuilder } from './deal-view.builder';

@Injectable()
export class DealNotificationService implements INotificationService {
  constructor(
    private readonly dealGateway: DealGateway,
    private readonly dealViewBuilder: DealViewBuilder,
  ) {}

  async notifyUser(event: DealUserNotificationEvent): Promise<void> {
    const userRoom = event.userId.toString();
    this.dealGateway.server
      .to(userRoom)
      .emit(event.type, { data: event.payload, trace: userRoom });
  }

  async notifyAllInRoom(
    event: DealRoomNotificationEvent | DealMessageNotificationEvent,
  ): Promise<void> {
    const roomId = event.roomId.toString();
    let payload: any = event;

    if ('deal' in event) {
      payload = await this.dealViewBuilder.build(event.deal);
    } else if ('message' in event) {
      payload = event.message;
    }

    this.dealGateway.server
      .to(roomId)
      .emit(event.type, { data: payload, trace: roomId });
  }

  async notifyUserImportantEvent(
    event: DealUserNotificationEvent,
  ): Promise<void> {
    await this.notifyUser(event);
  }

  async notifyAll(event: string, data: any): Promise<void> {
    this.dealGateway.server.emit(event, { data });
  }
}

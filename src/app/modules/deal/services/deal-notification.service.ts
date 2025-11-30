import { Injectable } from '@nestjs/common';
import {
  DealMessageNotificationEvent,
  DealRoomNotificationEvent,
  DealUserNotificationEvent,
} from '../events/deal-notification.event';
import { INotificationService } from '../interfaces/deal.interfaces';
import { DealGateway } from '../gateway/deal.gateway';

@Injectable()
export class DealNotificationService implements INotificationService {
  constructor(private readonly dealGateway: DealGateway) {}

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
    const payload =
      'deal' in event ? event.deal : 'message' in event ? event.message : event;

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

import { ISocketStorageConnectionRepository } from '../../../modules/socket-managers/client-storage/contract/socket-storage-connection.contract';
import { NotificationPayloadDTO } from '../dto/notification-payload.dto';

export interface INotifyParams {
  clientId?: string[];
  roomId?: string;
  payload: NotificationPayloadDTO;
  eventEmit?: string;
  exceptClientId?: string;
}

export interface INotificationGateway {
  readonly socketConnectionManager: ISocketStorageConnectionRepository;

  /**
   * Отправляет уведомление конкретному клиенту по его socketId.
   *
   * @param {string} socketId - идентификатор сокет-соединения клиента
   * @param {NotificationPayloadDTO} payload - данные уведомления
   * @param {string} eventName - название события для emit
   * @returns {Promise<void>}
   */
  notifyClient(
    socketId: string,
    payload: NotificationPayloadDTO,
    eventName?: string,
  ): Promise<void>;

  /**
   * Отправляет уведомления клиентам по socketId или roomId.
   *
   * @param {INotifyParams} params - Параметры для отправки уведомлений
   * @returns {Promise<void>}
   */
  notifyClients(params: INotifyParams): Promise<void>;
}

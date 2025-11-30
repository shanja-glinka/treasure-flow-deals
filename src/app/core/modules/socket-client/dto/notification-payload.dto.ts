export class NotificationPayloadDTO {
  event:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'notification.created'
    | 'notification.read';
  data: any; // полная сущность поста
  timestamp: number;
  trace?: string; // инфтрейс обновлённой сущности, для отладки
}

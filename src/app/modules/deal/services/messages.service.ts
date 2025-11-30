import { Injectable, Logger } from '@nestjs/common';
import { IMessagesService } from '../interfaces/deal.interfaces';
import { AddMessageDto } from '../dto/add-message.dto';
import { AddMessageReactionDto } from '../dto/add-message-reaction.dto';

@Injectable()
export class MessagesService implements IMessagesService {
  private readonly logger = new Logger(MessagesService.name);

  async addMessage(data: AddMessageDto): Promise<void> {
    // В текущей ветке нет встроенного чат-хранилища для сделок.
    // Делаем no-op с логированием, чтобы не ломать gateway-интеграцию.
    this.logger.debug(
      `addMessage noop: dealId=${data.dealId}, user=${data.user?.username}`,
    );
  }

  async addReaction(data: AddMessageReactionDto): Promise<void> {
    // Аналогично — no-op с логированием.
    this.logger.debug(
      `addReaction noop: dealId=${data.dealId}, msgId=${data.messageId}`,
    );
  }
}


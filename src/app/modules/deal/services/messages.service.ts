import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EventDealChanged,
  EventDealReactionAdded,
  IDealMemoryManagerServiceToken,
} from '@root/src/app/core/constants';
import { ValidatorHelper } from '@root/src/app/core/helpers';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { Role } from '@root/src/app/core/schemas/user.schema';
import { MessageReaction } from '@root/src/app/core/enums';
import { Types } from 'mongoose';
import { IMessagesService } from '../interfaces/deal.interfaces';
import { AddMessageDto } from '../dto/add-message.dto';
import { AddMessageReactionDto } from '../dto/add-message-reaction.dto';
import { IDealMemoryManagerService } from '../interfaces/memory-manager.service.interface';
import { NotificationType } from '../events/deal-notification.event';

@Injectable()
export class MessagesService implements IMessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @Inject(IDealMemoryManagerServiceToken)
    private readonly dealManagerService: IDealMemoryManagerService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addMessage(data: AddMessageDto): Promise<void> {
    const deal = await this.dealManagerService.get(data.dealId);
    this.ensureParticipant(deal, data.userId, data.user?.roles);

    const messages = Array.isArray(deal.messages) ? deal.messages : [];
    const nextId =
      messages.length > 0 ? messages[messages.length - 1].id + 1 : 1;

    const trimmed = data.message.trim();
    if (!trimmed.length) {
      throw new ForbiddenException('Пустые сообщения запрещены');
    }

    const message = {
      id: nextId,
      user: data.user,
      message: trimmed,
      createdAt: new Date(),
      reactions: [],
    };

    messages.push(message as any);
    deal.messages = messages as any;
    this.updateChatSummary(deal, data.userId);

    this.dealManagerService.set(deal);
    this.eventEmitter.emit(EventDealChanged, {
      roomId: deal._id,
      type: NotificationType.DEAL_UPDATED,
      deal,
    });

    this.logger.debug(
      `Message appended to deal=${deal._id.toString()}, id=${message.id}`,
    );
  }

  async addReaction(data: AddMessageReactionDto): Promise<void> {
    const deal = await this.dealManagerService.get(data.dealId);
    this.ensureParticipant(deal, data.userId, data.user?.roles);

    const messages = Array.isArray(deal.messages) ? deal.messages : [];
    const target = messages.find((msg) => msg.id === data.messageId);

    if (!target) {
      throw new NotFoundException('Сообщение не найдено');
    }

    target.reactions = Array.isArray(target.reactions) ? target.reactions : [];

    const userId = data.userId?.toString();
    if (!userId) {
      throw new ForbiddenException('Пользователь не определён');
    }

    const idx = target.reactions.findIndex(
      (reaction) => reaction.user?._id?.toString?.() === userId,
    );

    let changed = false;

    if (idx !== -1) {
      if (data.reaction === MessageReaction.NONE) {
        target.reactions.splice(idx, 1);
        changed = true;
      } else {
        target.reactions[idx].reaction = data.reaction;
        target.reactions[idx].addedAt = new Date();
        changed = true;
      }
    } else if (data.reaction !== MessageReaction.NONE) {
      target.reactions.push({
        reaction: data.reaction,
        user: data.user,
        addedAt: new Date(),
      } as any);
      changed = true;
    }

    if (!changed) {
      return;
    }

    this.dealManagerService.set(deal);
    this.eventEmitter.emit(EventDealReactionAdded, {
      roomId: deal._id,
      type: NotificationType.DEAL_MESSAGE_REACTION,
      message: target,
    });
  }

  private ensureParticipant(
    deal: DealDocument,
    userId?: string,
    roles: Role[] = [],
  ): void {
    if (!userId) {
      throw new ForbiddenException('Пользователь не найден');
    }

    const isAdmin = roles?.includes?.(Role.ADMIN) ?? false;
    if (isAdmin) {
      return;
    }

    const actorId = this.toObjectId(userId);
    const sellerId = this.extractObjectId(deal.seller);
    const buyerId = this.extractObjectId(deal.buyer);

    const isSeller = sellerId ? actorId.equals(sellerId) : false;
    const isBuyer = buyerId ? actorId.equals(buyerId) : false;

    if (!isSeller && !isBuyer) {
      throw new ForbiddenException(
        'Недостаточно прав для участия в чате сделки',
      );
    }
  }

  private extractObjectId(
    value:
      | Types.ObjectId
      | { _id?: Types.ObjectId }
      | string
      | null
      | undefined,
  ): Types.ObjectId | null {
    if (!value) {
      return null;
    }
    if (value instanceof Types.ObjectId) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return ValidatorHelper.validateObjectId(value);
      } catch {
        return null;
      }
    }
    if ((value as any)?._id) {
      return this.extractObjectId((value as any)._id);
    }
    return null;
  }

  private updateChatSummary(deal: DealDocument, userId?: string): void {
    const summary = deal.chat ?? ({} as any);
    summary.totalMessages = (summary.totalMessages ?? 0) + 1;
    summary.lastMessageAt = new Date();

    const authorId = userId ? this.extractObjectId(userId) : null;
    const sellerId = this.extractObjectId(deal.seller);
    const buyerId = this.extractObjectId(deal.buyer);

    if (authorId && sellerId && authorId.equals(sellerId)) {
      summary.buyerUnread = (summary.buyerUnread ?? 0) + 1;
    } else if (authorId && buyerId && authorId.equals(buyerId)) {
      summary.sellerUnread = (summary.sellerUnread ?? 0) + 1;
    } else {
      summary.buyerUnread = (summary.buyerUnread ?? 0) + 1;
      summary.sellerUnread = (summary.sellerUnread ?? 0) + 1;
    }

    deal.chat = summary;
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    return ValidatorHelper.validateObjectId(value);
  }
}

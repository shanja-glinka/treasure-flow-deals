import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EntityNotFoundMessage,
  EventDealChanged,
  EventDealCreated,
  EventDealFinished,
  IDealMemoryManagerServiceToken,
  IDealRepositoryToken,
} from '@root/src/app/core/constants';
import { ValidatorHelper } from '@root/src/app/core/helpers';
import { IPaginationResult } from '@root/src/app/core/common/filters/search/interfaces/pagination.interface';
import { Types } from 'mongoose';
import {
  Deal,
  DealCounterOfferStatus,
  DealDocument,
  DealModeEnum,
  DealStatusEnum,
} from '../../../core/schemas/deal.schema';
import { Role, UserDocument } from '../../../core/schemas/user.schema';
import { IDealRepository } from '../interfaces/deal.repository.interface';
import { IDealMemoryManagerService } from '../interfaces/memory-manager.service.interface';
import { CreateDealRequestDto } from '../types';
import { DealViewAs, FindDealDTO } from '../dto/get-deal.dto';
import {
  DealRoomNotificationEvent,
  NotificationType,
} from '../events/deal-notification.event';
import { DealViewBuilder } from './deal-view.builder';

@Injectable()
export class DealService {
  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,

    @Inject(IDealMemoryManagerServiceToken)
    private readonly dealMemoryManager: IDealMemoryManagerService,

    private readonly dealViewBuilder: DealViewBuilder,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Запускает аукцион.
   *
   * Логика:
   * - Проверяет, является ли входной параметр идентификатором или документом аукциона.
   * - Убеждается, что аукцион не активен (не запущен).
   * - Изменяет статус аукциона на 'ACTIVE' и устанавливает время начала.
   * - Если время завершения (`endAt`) не задано, устанавливает его на +3 суток от текущего момента.
   * - Генерирует событие о старте аукциона.
   *
   * @param {Types.ObjectId | Deal} deal Идентификатор или документ аукциона, который нужно запустить.
   *
   * @throws {NotFoundException} Если аукцион не найден.
   * @throws {BadRequestException} Если аукцион уже активен.
   */
  public async startDeal(deal: Types.ObjectId | any): Promise<void> {
    // Получаем документ аукциона (если передан ObjectId)
    const entity =
      deal instanceof Types.ObjectId
        ? await this.dealRepository.findOneBy(
            {
              _id: ValidatorHelper.validateObjectId(deal as Types.ObjectId),
            },
            true,
            true,
          )
        : deal;

    if (!entity) {
      throw new NotFoundException(EntityNotFoundMessage);
    }

    // Проверяем, что аукцион не активен
    if (entity.status === DealStatusEnum.ACTIVE) {
      throw new BadRequestException('Аукцион уже запущен.');
    }
  }

  /**
   * Завершает аукцион. Записывает время окончания аукциона и изменяет его статус на 'ENDED'.
   *
   * Логика:
   * - Проверяет, является ли входящий параметр идентификатором или документом аукциона.
   * - Если аукцион уже завершён, выбрасывается исключение.
   * - Изменяет статус аукциона на 'ENDED', записывает время окончания.
   * - Генерирует события для оповещения участников и победителя.
   *
   * @param {Types.ObjectId | Deal} deal Идентификатор или документ аукциона, который нужно завершить.
   *
   * @throws {NotFoundException} Если аукцион не найден.
   * @throws {BadRequestException} Если аукцион уже завершён.
   */
  public async finishDeal(deal: Types.ObjectId | any): Promise<void> {
    // Получаем документ аукциона (если передан ObjectId)
    const entity =
      deal instanceof Types.ObjectId
        ? await this.dealRepository.findOneBy(
            {
              _id: ValidatorHelper.validateObjectId(deal as Types.ObjectId),
            },
            true,
            true,
          )
        : deal;

    if (!entity) {
      throw new NotFoundException(EntityNotFoundMessage);
    }

    // Проверка на завершённость
    if (entity.status === DealStatusEnum.ENDED) {
      throw new BadRequestException(
        'Сделка уже завершена. Дальнейшие действия с ней запрещены.',
      );
    }

    // Изменение статуса и установка времени завершения (если не установлено)
    entity.status = DealStatusEnum.ENDED;
    entity.endedAt = entity.endedAt ?? new Date();

    await this.dealRepository.saveEntity(entity);

    // Эмитим служебное событие о закрытии сделки (для дальнейших слушателей)
    this.dealMemoryManager.set(entity, false);
    this.eventEmitter.emit(EventDealFinished, entity);
  }

  /**
   * Создаёт новую сделку на основе завершенного аукциона.
   *
   * Логика:
   * - Проверяет, что аукцион завершен
   * - Создаёт новый документ сделки с данными из аукциона
   * - Устанавливает все необходимые поля (seller, buyer, цены, статистика и т.д.)
   * - Сохраняет сделку в базу данных
   * - Генерирует событие о создании сделки
   *
   * @param {Auction} auction - Завершенный аукцион
   * @param {Types.ObjectId} conditionId - ID состояния монеты
   * @param {Types.ObjectId} coinId - ID монеты
   * @returns {Promise<any>} Созданная сделка
   */
  public async createDeal(data: CreateDealRequestDto): Promise<any> {
    const auctionId =
      data.auction !== undefined && data.auction !== null
        ? ValidatorHelper.validateObjectId(data.auction)
        : null;

    if (auctionId) {
      const exists = await this.dealRepository.findBy(
        { auction: auctionId },
        true,
      );
      if (exists) {
        return await this.dealRepository.findOneBy(
          { auction: auctionId },
          true,
          false,
        );
      }
    }

    const sellerId = ValidatorHelper.validateObjectId(data.seller);
    const buyerId =
      data.buyer !== null && data.buyer !== undefined
        ? ValidatorHelper.validateObjectId(data.buyer)
        : null;

    const normalizedItems = (data.items ?? []).map((item) => {
      const itemId = ValidatorHelper.validateObjectId(item.itemId);
      const coinId = ValidatorHelper.validateObjectId(item.coinId);
      const conditionId = item.conditionId
        ? ValidatorHelper.validateObjectId(item.conditionId)
        : null;

      return {
        itemId,
        coinId,
        conditionId,
        quantity: item.quantity ?? 1,
        price: item.price,
        snapshot: item.snapshot ?? null,
      };
    });

    if (!normalizedItems.length) {
      throw new BadRequestException(
        'Сделка должна содержать хотя бы один предмет',
      );
    }

    const primaryItem = normalizedItems[0];

    const autoCancelAt = data.guarantee?.autoCancelAt
      ? new Date(data.guarantee.autoCancelAt)
      : data.meta?.autoCancelAt
        ? new Date(data.meta.autoCancelAt as any)
        : null;

    const guarantee = {
      enabled: !!data.guarantee?.enabled,
      initiatedBy: data.guarantee?.initiatedBy
        ? ValidatorHelper.validateObjectId(data.guarantee.initiatedBy)
        : null,
      sellerApproved: data.guarantee?.sellerApproved ?? false,
      buyerApproved: data.guarantee?.buyerApproved ?? false,
      sellerApprovedAt: data.guarantee?.sellerApprovedAt
        ? new Date(data.guarantee.sellerApprovedAt)
        : null,
      buyerApprovedAt: data.guarantee?.buyerApprovedAt
        ? new Date(data.guarantee.buyerApprovedAt)
        : null,
      autoCancelAt,
    };

    const dealData: Partial<Deal> = {
      seller: sellerId,
      buyer: buyerId,
      mode: data.mode ?? DealModeEnum.DIRECT,
      status: data.status ?? DealStatusEnum.PENDING_SELLER,
      items: normalizedItems as any,
      startingPrice: data.startingPrice,
      finalPrice: data.finalPrice ?? null,
      guarantee,
      auctionStats: data.auctionStats ?? {
        totalBids: 0,
        highestBid: 0,
        auctionDuration: 0,
      },
      autoCancelAt,
      item: primaryItem.itemId,
      coin: primaryItem.coinId,
      condition: primaryItem.conditionId ?? undefined,
    };

    if (auctionId) {
      dealData.auction = auctionId;
    }

    // Создаем и сохраняем сделку через репозиторий, используя метод create
    const deal = await this.dealRepository.create(dealData as Deal);
    this.dealMemoryManager.set(deal, false);

    // Генерируем событие о создании сделки
    this.eventEmitter.emit(EventDealCreated, deal);

    return deal;
  }

  public async getUserDeals(
    userId: string,
    dto: FindDealDTO,
  ): Promise<IPaginationResult<DealDocument>> {
    const viewAs = dto.modifier?.viewAs ?? DealViewAs.SELLER;
    const match = this.buildParticipantMatch(userId, viewAs);
    return this.dealRepository.searchUserDeals(match, dto);
  }

  public async countUserDeals(
    userId: string,
    dto: FindDealDTO,
  ): Promise<number> {
    const viewAs = dto.modifier?.viewAs ?? DealViewAs.SELLER;
    const match = this.buildParticipantMatch(userId, viewAs);
    return this.dealRepository.countUserDeals(match, dto);
  }

  public async getDealDetails(
    dealId: string,
    viewer: UserDocument,
  ): Promise<any> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureCanViewDeal(deal, viewer);
    return this.dealViewBuilder.build(deal);
  }

  /**
   * Продавец запускает сделку (открывает чат и стадии).
   */
  public async startDealFlow(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureSeller(deal, actorId);

    if (deal.status !== DealStatusEnum.PENDING_SELLER) {
      throw new BadRequestException('Сделка уже была начата');
    }

    deal.startedAt = new Date();

    if (deal.mode === DealModeEnum.GUARANTEED && deal.guarantee?.enabled) {
      deal.status = DealStatusEnum.AWAITING_PAYMENT;
    } else {
      deal.status = DealStatusEnum.ACTIVE;
    }

    this.appendTimeline(deal, 'deal.started', actorId);

    this.persistDeal(deal);
    return deal;
  }

  public async buyerConfirmPayment(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureBuyer(deal, actorId);

    if (
      deal.mode !== DealModeEnum.GUARANTEED ||
      !deal.guarantee?.enabled ||
      deal.status !== DealStatusEnum.AWAITING_PAYMENT
    ) {
      throw new BadRequestException('Неверный этап сделки для оплаты');
    }

    deal.status = DealStatusEnum.AWAITING_DELIVERY;
    deal.confirmations = deal.confirmations ?? ({} as any);
    deal.confirmations.buyer = {
      done: true,
      doneAt: new Date(),
      confirmedBy: this.toObjectId(actorId),
      note: 'Покупатель подтвердил перевод средств гаранту',
    };
    this.appendTimeline(deal, 'buyer.payment_confirmed', actorId);
    this.persistDeal(deal);
    return deal;
  }

  public async sellerConfirmDelivery(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureSeller(deal, actorId);

    if (deal.status !== DealStatusEnum.AWAITING_DELIVERY) {
      throw new BadRequestException('Неверный этап сделки для передачи');
    }

    deal.status = DealStatusEnum.AWAITING_ACCEPTANCE;
    deal.confirmations = deal.confirmations ?? ({} as any);
    deal.confirmations.seller = {
      done: true,
      doneAt: new Date(),
      confirmedBy: this.toObjectId(actorId),
      note: 'Продавец подтвердил передачу монет',
    };
    this.appendTimeline(deal, 'seller.delivery_confirmed', actorId);
    this.persistDeal(deal);
    return deal;
  }

  public async buyerConfirmAcceptance(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureBuyer(deal, actorId);

    if (deal.status !== DealStatusEnum.AWAITING_ACCEPTANCE) {
      throw new BadRequestException('Неверный этап сделки для подтверждения');
    }

    deal.status = DealStatusEnum.READY_TO_CLOSE;
    this.appendTimeline(deal, 'buyer.acceptance_confirmed', actorId);
    this.persistDeal(deal);
    return deal;
  }

  public async closeDeal(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureSeller(deal, actorId);

    if (
      ![
        DealStatusEnum.READY_TO_CLOSE,
        DealStatusEnum.ACTIVE,
        DealStatusEnum.SELLER_STARTED,
      ].includes(deal.status)
    ) {
      throw new BadRequestException('Сделку нельзя закрыть на данном этапе');
    }

    deal.status = DealStatusEnum.ENDED;
    deal.endedAt = new Date();
    this.appendTimeline(deal, 'deal.closed', actorId);
    this.persistDeal(deal);
    this.eventEmitter.emit(EventDealFinished, deal);
    return deal;
  }

  public async cancelDeal(
    dealId: string,
    actorId: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);

    const actorObjectId = this.toObjectId(actorId);
    const isSeller = actorObjectId.equals(deal.seller);
    const isBuyer = !!deal.buyer && actorObjectId.equals(deal.buyer);

    if (!isSeller && !isBuyer) {
      throw new ForbiddenException('Недостаточно прав для отмены сделки');
    }

    if (
      deal.mode === DealModeEnum.GUARANTEED &&
      deal.guarantee?.enabled &&
      deal.status !== DealStatusEnum.PENDING_SELLER
    ) {
      throw new BadRequestException(
        'Гарантированная сделка может быть отменена только до активации гаранта',
      );
    }

    deal.status = DealStatusEnum.CANCELLED;
    deal.endedAt = new Date();
    this.appendTimeline(deal, 'deal.cancelled', actorId, {
      by: isSeller ? 'seller' : 'buyer',
    });
    this.persistDeal(deal);
    return deal;
  }

  public async openDispute(
    dealId: string,
    actorId: string,
    reason: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureParticipant(deal, actorId);

    if (deal.status === DealStatusEnum.DISPUTE) {
      throw new BadRequestException('Спор уже открыт');
    }

    deal.status = DealStatusEnum.DISPUTE;
    deal.dispute = {
      ...(deal.dispute ?? ({} as any)),
      isOpen: true,
      reason,
      openedBy: this.toObjectId(actorId),
      resolvedAt: null,
      resolution: null,
    };
    this.appendTimeline(deal, 'deal.dispute_opened', actorId, { reason });
    this.persistDeal(deal);
    return deal;
  }

  public async createCounterOffer(
    dealId: string,
    actorId: string,
    price: number,
    message?: string,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureParticipant(deal, actorId);

    if (
      [
        DealStatusEnum.CANCELLED,
        DealStatusEnum.ENDED,
        DealStatusEnum.DISPUTE,
      ].includes(deal.status)
    ) {
      throw new BadRequestException('Для этой сделки контрофферы недоступны');
    }

    deal.counterOffers = Array.isArray(deal.counterOffers)
      ? deal.counterOffers
      : [];

    deal.counterOffers.push({
      _id: new Types.ObjectId(),
      author: this.toObjectId(actorId),
      price,
      status: DealCounterOfferStatus.PENDING,
      message: message ?? null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    this.appendTimeline(deal, 'counter_offer.created', actorId, {
      price,
    });

    this.persistDeal(deal);
    return deal;
  }

  public async respondCounterOffer(
    dealId: string,
    actorId: string,
    counterOfferId: string,
    accept: boolean,
  ): Promise<DealDocument> {
    const deal = await this.getDealOrThrow(dealId);
    this.ensureParticipant(deal, actorId);

    const counterOffer = (deal.counterOffers ?? []).find(
      (offer) =>
        offer._id?.toString?.() === counterOfferId ||
        offer._id?.equals?.(counterOfferId),
    );

    if (!counterOffer) {
      throw new NotFoundException('Контроффер не найден');
    }

    if (counterOffer.status !== DealCounterOfferStatus.PENDING) {
      throw new BadRequestException('Контроффер уже обработан');
    }

    counterOffer.status = accept
      ? DealCounterOfferStatus.ACCEPTED
      : DealCounterOfferStatus.DECLINED;
    counterOffer.updatedAt = new Date();

    if (accept) {
      deal.finalPrice = counterOffer.price;
      const perItem = counterOffer.price / (deal.items?.length || 1);
      deal.items = (deal.items ?? []).map((item) => ({
        ...item,
        price: perItem,
      }));
    }

    this.appendTimeline(deal, 'counter_offer.responded', actorId, {
      counterOfferId,
      accept,
    });

    this.persistDeal(deal);
    return deal;
  }

  private async getDealOrThrow(dealId: string): Promise<DealDocument> {
    return this.dealMemoryManager.get(dealId);
  }

  private ensureSeller(deal: DealDocument, actorId: string) {
    if (!this.toObjectId(actorId).equals(deal.seller)) {
      throw new ForbiddenException('Требуется продавец');
    }
  }

  private ensureBuyer(deal: DealDocument, actorId: string) {
    if (!deal.buyer || !this.toObjectId(actorId).equals(deal.buyer)) {
      throw new ForbiddenException('Требуется покупатель');
    }
  }

  private ensureParticipant(deal: DealDocument, actorId: string) {
    const actorObjectId = this.toObjectId(actorId);
    if (
      !actorObjectId.equals(deal.seller) &&
      (!deal.buyer || !actorObjectId.equals(deal.buyer))
    ) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  private ensureCanViewDeal(deal: DealDocument, viewer: UserDocument): void {
    const roles = viewer?.roles ?? [];
    if (roles.includes(Role.ADMIN)) {
      return;
    }

    const viewerId = this.toObjectId(viewer._id);
    const sellerId = this.extractObjectId(deal.seller);
    const buyerId = this.extractObjectId(deal.buyer);

    if (
      (!sellerId || !viewerId.equals(sellerId)) &&
      (!buyerId || !viewerId.equals(buyerId))
    ) {
      throw new ForbiddenException('Недостаточно прав для просмотра сделки');
    }
  }

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return ValidatorHelper.validateObjectId(id);
  }

  private appendTimeline(
    deal: DealDocument,
    type: string,
    actorId?: string,
    payload?: Record<string, any>,
  ) {
    deal.timeline = Array.isArray(deal.timeline) ? deal.timeline : [];
    deal.timeline.push({
      type,
      happenedAt: new Date(),
      actor: actorId ? this.toObjectId(actorId) : null,
      payload: payload ?? null,
    } as any);
  }

  private persistDeal(deal: DealDocument, markChanged = true): void {
    this.dealMemoryManager.set(deal, markChanged);
    const event: DealRoomNotificationEvent = {
      roomId: deal._id,
      type: NotificationType.DEAL_UPDATED,
      deal: deal,
    };
    this.eventEmitter.emit(EventDealChanged, event);
  }

  private buildParticipantMatch(
    userId: string,
    viewAs: DealViewAs = DealViewAs.SELLER,
  ) {
    const field =
      viewAs === DealViewAs.BUYER ? 'buyer' : ('seller' as 'seller' | 'buyer');

    return {
      [field]: ValidatorHelper.validateObjectId(userId),
    };
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
}

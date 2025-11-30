import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EntityNotFoundMessage,
  EventDealCreated,
  EventDealFinished,
  IDealRepositoryToken,
} from '@root/src/app/core/constants';
import { ValidatorHelper } from '@root/src/app/core/helpers';
import { Types } from 'mongoose';
import {
  Deal,
  DealModeEnum,
  DealStatusEnum,
} from '../../../core/schemas/deal.schema';
import { IDealRepository } from '../interfaces/deal.repository.interface';
import { CreateDealRequestDto } from '../types';

@Injectable()
export class DealService {
  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,

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
    this.eventEmitter.emit(EventDealFinished, entity._id.toString());
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

    // Генерируем событие о создании сделки
    this.eventEmitter.emit(EventDealCreated, deal);

    return deal;
  }
}

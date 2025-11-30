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
import { Deal, DealTypeEnum } from '../../../core/schemas/deal.schema';
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
    if (entity.status === DealTypeEnum.ACTIVE) {
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
    if (entity.status === DealTypeEnum.ENDED) {
      throw new BadRequestException(
        'Сделка уже завершена. Дальнейшие действия с ней запрещены.',
      );
    }

    // Изменение статуса и установка времени завершения (если не установлено)
    entity.status = DealTypeEnum.ENDED;
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
    // Проверка на дублирование по аукциону
    const exists = await this.dealRepository.findBy(
      { auction: ValidatorHelper.validateObjectId(data.auction) },
      true,
    );
    if (exists) {
      return await this.dealRepository.findOneBy(
        { auction: ValidatorHelper.validateObjectId(data.auction) },
        true,
        false,
      );
    }

    const dealData: Partial<Deal> = {
      ...data,
      item: ValidatorHelper.validateObjectId(data.item),
      coin: ValidatorHelper.validateObjectId(data.coin),
      seller: ValidatorHelper.validateObjectId(data.seller),
      auction: ValidatorHelper.validateObjectId(data.auction),
      buyer:
        data.buyer !== null
          ? ValidatorHelper.validateObjectId(data.buyer)
          : null,
      condition: ValidatorHelper.validateObjectId(data.condition),
      status: DealTypeEnum.ACTIVE,
      endedAt: new Date(data.endedAt),
    };

    // Создаем и сохраняем сделку через репозиторий, используя метод create
    const deal = await this.dealRepository.create(dealData);

    // Генерируем событие о создании сделки
    this.eventEmitter.emit(EventDealCreated, deal);

    return deal;
  }
}

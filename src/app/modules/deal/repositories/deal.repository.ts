import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EntityNotFoundMessage } from '@root/src/app/core/constants';
import { ValidatorHelper } from '@root/src/app/core/helpers';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Deal,
  DealDocument,
  DealTypeEnum,
} from '../../../core/schemas/deal.schema';
import { IDealRepository } from '../interfaces/deal.repository.interface';

@Injectable()
export class DealRepository implements IDealRepository {
  constructor(
    @InjectModel(Deal.name)
    private dealModel: Model<DealDocument>,
  ) {}

  /**
   * Извлекает аукцион по заданному фильтру.
   * Может использоваться для проверки существования или для получения одного документа аукциона.
   *
   * @param {FilterQuery<DealDocument>} filter - Фильтр MongoDB, применяемый при поиске аукциона.
   * @param {boolean} asExists - Если true, проверяет наличие документа и возвращает булево значение. Если false, возвращает сам документ или null, если документ не найден.
   *
   * @returns {Promise<DealDocument | null | boolean>} - В зависимости от параметра `asExists`: возвращает булево значение, если `asExists` равен true, или документ или null, если `asExists` равен false.
   */
  async findBy(
    filter: FilterQuery<DealDocument>,
    asExists = false,
  ): Promise<DealDocument | null | boolean> {
    if (asExists) {
      return !!(await this.dealModel.exists(filter));
    }

    return this.dealModel.findOne(filter).exec();
  }

  /**
   * Находит один аукцион по фильтру.
   *
   * @param {FilterQuery<DealDocument>} filter - Фильтр MongoDB, применяемый при поиске аукциона.
   * @param {boolean} populate - Загружать отношения.
   * @param {boolean} throwOnEmpty - Выбрасывать ошибку, если не найден.
   *
   * @returns {Promise<DealDocument | null>} Документ аукцион или `null`, если не найден.
   *
   * @throws {NotFoundException}
   */
  async findOneBy(
    filter: FilterQuery<DealDocument>,
    populate = true,
    throwOnEmpty = false,
  ): Promise<DealDocument | null> {
    const res = await this.dealModel
      .findOne(filter)
      .populate(
        populate
          ? [
              'seller',
              {
                path: 'item', // field in Deal referring to UserCoinItem
                populate: {
                  path: 'coin', // field in UserCoinItem referring to Coin
                  model: 'Coin', // assuming you have a Coin model
                },
              },
            ]
          : undefined,
      )
      .exec();

    if (throwOnEmpty && !res) {
      throw new NotFoundException(EntityNotFoundMessage);
    }

    return res;
  }

  /**
   * Находит аукцион по идентификатору.
   *
   * @param {string | Types.ObjectId} id - Идентификатор аукциона.
   * @param {boolean} throwOnEmpty - Выбрасывать ошибку, если не найден.
   * @param {boolean} populate - Загружать отношения.
   *
   * @returns {Promise<DealDocument | null>} Документ аукцион или `null`, если не найден.
   *
   * @throws {NotFoundException}
   */
  async findById(
    id: string | Types.ObjectId,
    throwOnEmpty = false,
    populate = true,
  ): Promise<DealDocument | null> {
    const res = await this.dealModel
      .findById(ValidatorHelper.validateObjectId(id))
      .populate(
        populate
          ? [
              'seller',
              {
                path: 'item', // field in Deal referring to UserCoinItem
                populate: {
                  path: 'coin', // field in UserCoinItem referring to Coin
                  model: 'Coin', // assuming you have a Coin model
                },
              },
            ]
          : undefined,
      )
      .exec();

    if (throwOnEmpty && !res) {
      throw new NotFoundException(EntityNotFoundMessage);
    }

    return res;
  }

  /**
   * Создает новый документ сделки из объекта данных.
   *
   * @param {Partial<Deal>} dealData - Данные для создания сделки
   * @returns {Promise<DealDocument>} Созданный документ сделки
   */
  async create(dealData: Partial<Deal>): Promise<DealDocument> {
    const deal = new this.dealModel(dealData);
    return deal.save();
  }

  /**
   * Сохраняет изменения в документе аукциона.
   *
   * Логика:
   * - Вызывает метод сохранения документа Mongoose.
   * - Возвращает результат операции сохранения.
   *
   * @param {DealDocument} entity Документ аукциона, который нужно сохранить.
   *
   * @returns {Promise<DealDocument>} Сохранённый документ аукциона.
   */
  async saveEntity(entity: DealDocument): Promise<DealDocument> {
    // Если передан простой объект вместо документа, создаём документ
    if (!(entity instanceof this.dealModel)) {
      return this.create(entity as any);
    }
    return entity.save();
  }

  /**
   * Получает список аукционов, которые должны начаться.
   *
   * Логика:
   * - Ищет аукционы со статусом "Планируется" и датой начала меньше или равной текущему времени.
   * - Если указан threshold, добавляет миллисекунды к текущему времени и ищет в указанном диапазоне.
   *
   * @param {number} [threshold=0] - Время в миллисекундах, добавляемое к текущему моменту для фильтрации.
   * @returns {Promise<DealDocument[]>} Список найденных документов аукционов.
   */
  async getDealsToStart(threshold = 0): Promise<DealDocument[]> {
    const now = new Date();

    const filter: any = {
      status: DealTypeEnum.ACTIVE,
      startAt: { $lte: now },
    };

    if (threshold > 0) {
      filter.startAt = { $lte: new Date(now.getTime() + threshold), $gt: now };
    }

    return this.dealModel.find(filter).exec();
  }

  /**
   * Возвращает список аукционов, которые должны быть завершены.
   *
   * Логика:
   * - Находит аукционы со статусом "ACTIVE", у которых время завершения (`endAt`) меньше или равно текущему моменту.
   *
   * @returns {Promise<DealDocument[]>} Список аукционов, которые необходимо завершить.
   */
  async getDealsToFinish(): Promise<DealDocument[]> {
    const now = new Date();

    return this.dealModel
      .find({
        status: DealTypeEnum.ACTIVE,
        endedAt: { $lte: now },
      })
      .exec();
  }
}

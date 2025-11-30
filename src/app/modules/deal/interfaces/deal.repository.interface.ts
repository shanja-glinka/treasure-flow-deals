import { FilterQuery, Types } from 'mongoose';
import { Deal, DealDocument } from '../../../core/schemas/deal.schema';
import { FindDealDTO } from '../dto/get-deal.dto';
import { IPaginationResult } from '@root/src/app/core/common/filters/search/interfaces/pagination.interface';

export interface IDealRepository {
  /**
   * Находит аукцион по заданному фильтру.
   * @param filter Фильтр запроса.
   * @param asExists Если true, проверяет существование, не возвращая данные.
   */
  findBy(
    filter: FilterQuery<DealDocument>,
    asExists?: boolean,
  ): Promise<DealDocument | null | boolean>;

  /**
   * Находит один аукцион по фильтру.
   * @param filter Фильтр запроса.
   * @param populate Загружать связи.
   * @param throwOnEmpty Выбрасывать ошибку если не найден.
   */
  findOneBy(
    filter: FilterQuery<DealDocument>,
    populate?: boolean,
    throwOnEmpty?: boolean,
  ): Promise<DealDocument | null>;

  /**
   * Находит аукцион по идентификатору.
   * @param id Идентификатор.
   * @param throwOnEmpty Выбрасывать ошибку если не найден.
   * @param populate Загружать связи.
   */
  findById(
    id: string | Types.ObjectId,
    throwOnEmpty?: boolean,
    populate?: boolean,
  ): Promise<DealDocument | null>;

  /**
   * Создает новый документ сделки из объекта данных.
   * @param dealData Данные для создания сделки
   */
  create(dealData: Partial<Deal>): Promise<DealDocument>;

  /**
   * Сохраняет изменения в аукционе.
   * @param entity Сущность аукциона.
   */
  saveEntity(entity: DealDocument): Promise<DealDocument>;

  /**
   * Получает список аукционов, которые скоро должны начаться.
   * @param threshold Порог в миллисекундах.
   */
  getDealsToStart(threshold?: number): Promise<DealDocument[]>;

  /**
   * Получает список аукционов, которые должны быть завершены.
   */
  getDealsToFinish(): Promise<DealDocument[]>;

  searchUserDeals(
    match: FilterQuery<DealDocument>,
    dto: FindDealDTO,
  ): Promise<IPaginationResult<DealDocument>>;

  countUserDeals(
    match: FilterQuery<DealDocument>,
    dto?: FindDealDTO,
  ): Promise<number>;
}

import { DealDocument } from '@root/src/app/core/schemas/deal.schema';

export interface IDealValidator {
  /**
   * Проводит проверки отдельных значений атрибутов аукциона.
   * Включает проверки наличия лота, корректности дат и положительности числовых значений.
   *
   * @param {DealDocument | Partial<DealDocument>} dto - Полный или частичный объект данных аукциона.
   * @throws {NotFoundException} - Если лот аукциона не указан.
   * @throws {BadRequestException} - Если даты или ценовые параметры некорректны.
   */
  validateScalar(dto: DealDocument | Partial<DealDocument>): void;

  /**
   * Проверяет возможность и корректность изменения статуса аукциона.
   * Устанавливает даты начала и окончания аукциона в зависимости от нового статуса.
   *
   * @param {DealDocument} entity - Текущий документ аукциона, содержащий текущий статус.
   * @param {DealDocument} dto - Объект данных, содержащий предложенные изменения статуса.
   * @throws {BadRequestException} - Если пытаются изменить статус завершённого аукциона.
   *
   * Если статус изменяется на 'ENDED', записывается время окончания аукциона.
   * Если статус изменяется на 'ACTIVE', записывается время начала аукциона.
   */
  validateStatusMovement(
    entity: DealDocument,
    dto: DealDocument | Partial<DealDocument>,
  ): void;
}

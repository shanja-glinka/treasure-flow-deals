import { BadRequestException } from '@nestjs/common';
import { ValidationPipeConfig } from '@root/src/config/validation-pipe.config';
import { plainToInstance } from 'class-transformer';
import { FilterQuery, Types } from 'mongoose';

/**
 * Интерфейс для описания параметров сортировки и пагинации.
 */
export interface OrderQuery {
  /**
   * Объект сортировки (например, { field: 1 } или { field: -1 }).
   */
  sort: Record<string, 1 | -1>;

  /**
   * Лимит количества возвращаемых записей.
   */
  limit: number | null;

  /**
   * Смещение (пропуск) записей для пагинации.
   */
  skip: number;
}

/**
 * Вспомогательный класс для валидации и построения запросов.
 */
export class ValidatorHelper {
  /**
   * Создает объект фильтрации по ObjectId.
   *
   * @template SchemaType Тип документа в Mongoose.
   * @param objectId Строка ObjectId для фильтрации.
   * @returns Объект фильтрации для Mongoose.
   */
  public static getFilterObjectId<SchemaType>(
    objectId: string,
  ): FilterQuery<SchemaType> {
    if (typeof objectId === 'object' && objectId !== null) {
      objectId = (objectId as string).toString();
    }

    ValidatorHelper.validateObjectId(objectId);

    return { _id: objectId } as FilterQuery<SchemaType>;
  }

  /**
   * Валидирует переданный ObjectId.
   *
   * @param objectId Строка ObjectId для проверки.
   * @throws BadRequestException Если ObjectId недействителен.
   * @returns Объект `Types.ObjectId`.
   */
  public static validateObjectId(
    objectId: string | Types.ObjectId,
  ): Types.ObjectId {
    const objectIdStr =
      typeof objectId === 'string' ? objectId : objectId.toString();

    if (!objectIdStr || !objectIdStr.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException(`Invalid ObjectId '${objectId}' in query`);
    }

    return new Types.ObjectId(objectIdStr);
  }

  /**
   * Валидирует одиночный DTO или массив DTO на основе указанного класса валидации.
   *
   * - Если передан одиночный DTO, выполняется его прямая валидация.
   * - Если передан массив DTO, каждый элемент массива валидируется отдельно.
   * - Ошибки валидации для каждого элемента массива собираются и возвращаются
   *   в виде `BadRequestException` с подробной информацией.
   * - Для одиночного DTO ошибки валидации выбрасываются сразу.
   *
   * @template DTO - Тип DTO, который требуется валидировать.
   * @param validationClass - Класс для валидации (должен быть конструктором).
   * @param dtos - Одиночный DTO или массив DTO для валидации.
   * @throws {BadRequestException} - Если валидация одного или нескольких элементов массива не удалась.
   * @throws {Error} - Если валидация одиночного DTO не удалась.
   */
  static async validateDto<DTO>(
    validationClass: new () => DTO,
    dtos: DTO | DTO[],
  ): Promise<DTO | DTO[]> {
    const validateInstance = async (dto: DTO, index?: number): Promise<DTO> => {
      try {
        const transformedDto = await ValidationPipeConfig().transform(dto, {
          type: 'body',
          metatype: validationClass,
        });
        return transformedDto;
      } catch (error) {
        if (index !== undefined) {
          throw {
            index,
            errors:
              error?.response?.errors ||
              error?.response?.message ||
              error?.errors ||
              error?.message,
          };
        }
        throw error;
      }
    };

    if (Array.isArray(dtos)) {
      const transformedDtos: DTO[] = [];
      const validationErrors = [];
      for (const [index, dto] of dtos.entries()) {
        try {
          const transformed = await validateInstance(dto, index);
          transformedDtos.push(transformed);
        } catch (error) {
          validationErrors.push({
            message: `Массив на индексе '${error.index}' имеет ошибки:`,
            errors:
              error?.response?.errors ||
              error?.errors ||
              (error?.response?.message ?? error?.message),
          });
        }
      }

      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      return transformedDtos;
    } else {
      return await validateInstance(dtos);
    }
  }

  /**
   * !!Deprecated
   *
   * @template DTO
   * @param {*} validation
   * @param {(DTO[] | DTO)} dtos
   * @returns {*}
   */
  static async __validateDto<DTO>(validation: any, dtos: DTO[] | DTO) {
    const validationErrors = [];

    if (!Array.isArray(dtos)) {
      const dtoInstance = plainToInstance(validation, dtos);
      await ValidationPipeConfig().transform(dtoInstance, {
        type: 'body',
        metatype: validation,
      });
      return;
    }

    let indexItem = 0;
    for (const dto of dtos as DTO[]) {
      const dtoInstance = plainToInstance(validation, dto);

      try {
        await ValidationPipeConfig().transform(dtoInstance, {
          type: 'body',
          metatype: validation,
        });
      } catch (error) {
        validationErrors.push({
          message: `Array at index ${indexItem} has errors:`,
          errors:
            error?.response?.errors ||
            (error?.response?.message ?? error?.message),
        });
      }

      indexItem++;
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }
  }
}

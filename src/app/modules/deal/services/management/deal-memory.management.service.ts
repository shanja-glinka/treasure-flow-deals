import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { IDealRepositoryToken } from '@root/src/app/core/constants';
import { IDealRepository } from '../../interfaces/deal.repository.interface';
import { IDealMemoryManagerService } from '../../interfaces/memory-manager.service.interface';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';

@Injectable()
export class DealMemoryManagerService implements IDealMemoryManagerService {
  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,
  ) {}

  public async get(dealId: string | Types.ObjectId): Promise<DealDocument> {
    // Простая реализация: читаем из БД по id
    const deal = await this.dealRepository.findById(dealId, true, true);
    return deal as DealDocument;
  }

  public set(deal: DealDocument): void {
    // no-op для текущей ветки
  }

  public markChanged(dealId: string | Types.ObjectId): void {
    // no-op
  }

  public getAllChanged(): DealDocument[] {
    return [];
  }

  public resetAllChangedFlags(): void {
    // no-op
  }

  public getAll(): DealDocument[] {
    return [];
  }

  public remove(dealId: string | Types.ObjectId): void {
    // no-op
  }
}

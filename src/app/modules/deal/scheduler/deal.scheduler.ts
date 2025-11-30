import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IDealMemoryManagerServiceToken,
  IDealRepositoryToken,
} from '@root/src/app/core/constants';
import { IDealRepository } from '../interfaces/deal.repository.interface';
import { DealService } from '../services/deal.service';
import { IDealMemoryManagerService } from '../interfaces/memory-manager.service.interface';

@Injectable()
export class DealScheduler {
  private readonly logger = new Logger(DealScheduler.name);
  private running = false;
  private syncing = false;

  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,

    @Inject(IDealMemoryManagerServiceToken)
    private readonly dealManagerService: IDealMemoryManagerService,

    private readonly dealService: DealService,
  ) {}

  // Проверяем окончания сделок каждые 5 минут
  @Cron(CronExpression.EVERY_5_MINUTES)
  async finishExpiredDeals() {
    if (this.running) return;
    this.running = true;
    try {
      const toFinish = await this.dealRepository.getDealsToFinish();
      for (const deal of toFinish) {
        try {
          await this.dealService.finishDeal(deal);
          this.logger.log(
            `Deal '${deal._id.toString()}' finished by scheduler`,
          );
        } catch (e) {
          this.logger.error(
            `Failed to finish deal '${deal._id.toString()}' by scheduler`,
            e as any,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }

  @Cron('*/10 * * * * *')
  async syncInMemoryDeals() {
    if (this.syncing) {
      return;
    }
    this.syncing = true;

    try {
      const changedDeals = this.dealManagerService.getAllChanged();
      for (const deal of changedDeals) {
        try {
          await this.dealRepository.saveEntity(deal);
          this.dealManagerService.markSynced(deal._id);
        } catch (error) {
          this.logger.error(
            `Failed to sync deal ${deal._id.toString()}`,
            error as any,
          );
        }
      }

      const staleEntries = this.dealManagerService.getStaleEntries(
        5 * 60 * 1000,
      );
      for (const entry of staleEntries) {
        try {
          if (entry.changed) {
            await this.dealRepository.saveEntity(entry.deal);
            this.dealManagerService.markSynced(entry.deal._id);
          }
        } catch (error) {
          this.logger.error(
            `Failed to persist stale deal ${entry.deal._id.toString()}`,
            error as any,
          );
        } finally {
          this.dealManagerService.remove(entry.deal._id);
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}

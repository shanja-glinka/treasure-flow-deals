import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IDealRepositoryToken } from '@root/src/app/core/constants';
import { IDealRepository } from '../interfaces/deal.repository.interface';
import { DealService } from '../services/deal.service';

@Injectable()
export class DealScheduler {
  private readonly logger = new Logger(DealScheduler.name);
  private running = false;

  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,

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
}

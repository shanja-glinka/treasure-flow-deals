import {
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DealService } from '../services/deal.service';
import {
  CreateDealRequestDto,
  QueueProcessorDeal,
  QueueTaskCreateDeal,
} from '../types';

@Processor(QueueProcessorDeal)
export class DealProcessor {
  private readonly logger = new Logger(DealProcessor.name);

  constructor(private readonly dealService: DealService) {}

  @OnQueueCompleted()
  onQueueCompletedHandler(job: Job<any>, result: any) {
    this.logger.log(`Queue ${job.name} completed with result: ${result}`);
  }

  /**
   * Обрабатывает ошибки в очереди
   * @param error - ошибка
   */
  @OnQueueError()
  handleError(error: Error) {
    this.logger.error(
      `[${DealProcessor.name}] Ошибка в очереди уведомлений: ${error.message}`,
      error,
    );
  }

  /**
   * Обрабатывает ошибки в задачах очереди
   * @param job - задача
   * @param error - ошибка
   */
  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(
      `[${DealProcessor.name}] Задача ${job.id} в очереди '${job.name}' уведомлений завершилась с ошибкой: ${error.message}`,
      error,
    );
  }

  /**
   * Обрабатывает задачу сохранения уведомлений без эмита событий (для внешних сервисов).
   *
   * @param job - Задача Bull, содержащая массив DTO уведомлений для сохранения.
   */
  @Process({ name: QueueTaskCreateDeal, concurrency: 100 })
  async handleCreateDeal(job: Job<CreateDealRequestDto>) {
    this.logger.log(`Creating deal for auction ${job.data.auction}`);
    try {
      const deal = await this.dealService.createDeal(job.data);

      this.logger.log(
        `Deal ${deal?._id?.toString?.() ?? 'unknown'} created for auction ${job.data.auction}`,
      );

      return typeof deal?.toJSON === 'function' ? deal.toJSON() : deal;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(String(error ?? 'Unknown'));

      this.logger.error(
        `Failed to create deal for auction ${job.data.auction}: ${err.message}`,
        err.stack,
      );

      throw err;
    }
  }
}

import { DealTypeEnum } from '../../core/schemas/deal.schema';

export const QueueProcessorDeal = 'queue-processor-deal';

export const QueueTaskCreateDeal = 'queue-task-create-deal';

export interface CreateDealRequestDto {
  item: string;
  coin: string;
  seller: string;
  auction: string;
  buyer: string | null;
  status: DealTypeEnum.ACTIVE;
  startingPrice: number;
  finalPrice: number;
  condition: string;
  // Планируем закрытие сделки через 7 дней от момента создания
  endedAt: Date;
  auctionStats: {
    totalBids: number;
    highestBid: number;
    auctionDuration: number;
  };
}

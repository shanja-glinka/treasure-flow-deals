import { DealModeEnum, DealStatusEnum } from '../../core/schemas/deal.schema';

export const QueueProcessorDeal = 'queue-processor-deal';

export const QueueTaskCreateDeal = 'queue-task-create-deal';

export interface DealItemPayloadDto {
  itemId: string;
  coinId: string;
  conditionId?: string | null;
  quantity?: number;
  price: number;
  snapshot?: Record<string, any>;
}

export interface DealGuaranteePayloadDto {
  enabled: boolean;
  initiatedBy?: string | null;
  sellerApproved?: boolean;
  buyerApproved?: boolean;
  sellerApprovedAt?: Date | null;
  buyerApprovedAt?: Date | null;
  autoCancelAt?: Date | null;
}

export interface CreateDealRequestDto {
  seller: string;
  auction?: string;
  buyer: string | null;
  mode: DealModeEnum;
  status: DealStatusEnum;
  items: DealItemPayloadDto[];
  startingPrice: number;
  finalPrice: number;
  guarantee: DealGuaranteePayloadDto;
  auctionStats: {
    totalBids: number;
    highestBid: number;
    auctionDuration: number;
  };
  meta?: Record<string, any>;
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CoinDealStat,
  CoinDealStatDocument,
} from '@root/src/app/core/schemas/coin-deal-stat.schema';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';

@Injectable()
export class DealStatsService {
  constructor(
    @InjectModel(CoinDealStat.name)
    private readonly statsModel: Model<CoinDealStatDocument>,
  ) {}

  public async recordDeal(deal: DealDocument): Promise<void> {
    if (!deal?.items?.length) {
      return;
    }

    const sellerId = this.extractId(deal.seller);
    if (!sellerId) {
      return;
    }

    const soldAt = deal.endedAt ? new Date(deal.endedAt) : new Date();
    const buyerId = this.extractId(deal.buyer);

    const docs = deal.items
      .map((item) => {
        const coinId = this.extractId(item.coinId);
        if (!coinId) {
          return null;
        }

        return {
          dealId: deal._id as Types.ObjectId,
          coinId,
          seller: sellerId,
          buyer: buyerId,
          price: item.price ?? deal.finalPrice ?? deal.startingPrice,
          quantity: item.quantity ?? 1,
          conditionId: this.extractId(item.conditionId) ?? null,
          soldAt,
          mode: deal.mode,
        };
      })
      .filter((entry): entry is CoinDealStat => !!entry);

    if (!docs.length) {
      return;
    }

    await this.statsModel.insertMany(docs);
  }

  private extractId(value: any): Types.ObjectId | null {
    if (!value) {
      return null;
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    if (value?._id) {
      return this.extractId(value._id);
    }

    return null;
  }
}

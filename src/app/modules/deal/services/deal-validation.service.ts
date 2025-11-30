import { Injectable } from '@nestjs/common';
import { IDealValidationService } from '../interfaces/deal.interfaces';
import { Types } from 'mongoose';

@Injectable()
export class DealValidationService implements IDealValidationService {
  /**
   * По условию задачи, сейчас просто возвращаем true,
   * но метод существует, чтобы в будущем расширить логику.
   */
  async validateUserInDeal(
    dealId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    void dealId;
    void userId;
    return true;
  }
}

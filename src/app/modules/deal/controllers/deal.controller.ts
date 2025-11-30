import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '@root/src/app/core/common/decorators/current-user.decorator';
import { Auth } from '@root/src/app/core/decorators';
import { SuccessResponseDto } from '@root/src/app/core/interceptors';
import { ClsServiceAdapter } from '@root/src/app/core/modules/cls/cls.service-adapter';
import { UserDocument } from '@root/src/app/core/schemas/user.schema';
import {
  DealCounterOfferDto,
  DealCounterOfferResponseDto,
  DealDisputeDto,
} from '../dto/deal-action.dto';
import { DealViewAs, FindDealDTO } from '../dto/get-deal.dto';
import { DealService } from '../services/deal.service';

@ApiTags('Deal')
@Controller({
  path: 'deal',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
export class DealController {
  @Inject(ClsServiceAdapter)
  private readonly cls: ClsServiceAdapter;

  constructor(private readonly dealService: DealService) {}

  /**
   * Возвращает сделки, где пользователь является участником за последние две недели.
   */
  @Post('/my/deals')
  @ApiResponse({
    status: 200,
    description: 'Список сделок с участием пользователя успешно получен.',
    type: SuccessResponseDto,
  })
  @Auth()
  async getMyDeals(
    @CurrentUser() user: UserDocument,
    @Body() dto: FindDealDTO,
  ) {
    const actorId = this.ensureUser(user);
    const data = await this.dealService.getUserDeals(actorId, dto);
    return new SuccessResponseDto(data.items, data.meta);
  }

  /**
   * Возвращает количество аукционов, где пользователь делал ставки за последние две недели.
   */
  @Get('/my/deals/count')
  @Auth()
  @ApiResponse({
    status: 200,
    description:
      'Количество аукционов с участием пользователя успешно получено.',
    type: SuccessResponseDto,
  })
  async getMyDealsCount(
    @CurrentUser() user: UserDocument,
    @Query('viewAs') viewAs?: DealViewAs,
  ) {
    const actorId = this.ensureUser(user);
    const dto = new FindDealDTO();
    dto.viewAs = this.resolveViewAs(viewAs);
    const count = await this.dealService.countUserDeals(actorId, dto);
    return new SuccessResponseDto({ count });
  }

  @Post('/:dealId/start')
  @Auth()
  async startDeal(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.startDealFlow(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/buyer/payment')
  @Auth()
  async confirmPayment(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.buyerConfirmPayment(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/seller/delivery')
  @Auth()
  async confirmDelivery(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.sellerConfirmDelivery(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/buyer/acceptance')
  @Auth()
  async confirmAcceptance(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.buyerConfirmAcceptance(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/close')
  @Auth()
  async closeDeal(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.closeDeal(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/cancel')
  @Auth()
  async cancelDeal(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.cancelDeal(dealId, actorId);
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/dispute')
  @Auth()
  async openDispute(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
    @Body() dto: DealDisputeDto,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.openDispute(
      dealId,
      actorId,
      dto.reason,
    );
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/counter-offers')
  @Auth()
  async createCounterOffer(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
    @Body() dto: DealCounterOfferDto,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.createCounterOffer(
      dealId,
      actorId,
      dto.price,
      dto.message,
    );
    return new SuccessResponseDto(deal);
  }

  @Post('/:dealId/counter-offers/:counterOfferId/respond')
  @Auth()
  async respondCounterOffer(
    @CurrentUser() user: UserDocument,
    @Param('dealId') dealId: string,
    @Param('counterOfferId') counterOfferId: string,
    @Body() dto: DealCounterOfferResponseDto,
  ) {
    const actorId = this.ensureUser(user);
    const deal = await this.dealService.respondCounterOffer(
      dealId,
      actorId,
      counterOfferId,
      dto.accept,
    );
    return new SuccessResponseDto(deal);
  }

  private ensureUser(user: UserDocument): string {
    if (!user?._id) {
      throw new UnauthorizedException('User context is required');
    }
    return user._id.toString();
  }

  private resolveViewAs(value?: DealViewAs): DealViewAs {
    return value === DealViewAs.BUYER ? DealViewAs.BUYER : DealViewAs.SELLER;
  }
}

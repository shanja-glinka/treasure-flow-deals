import {
  Body,
  Controller,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IUserRepositoryToken, USER_KEY } from '@root/src/app/core/constants';
import { Role } from '@root/src/app/core/enums';
import { ClsServiceAdapter } from '@root/src/app/core/modules/cls/cls.service-adapter';
import { UserDocument } from '@root/src/app/core/schemas/user.schema';
import { IUserRepository } from '../../users/interfaces/user.repository.interface';
import { NotificationService } from '../services/notification.service';

@Controller({
  path: 'notification',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
export class NotificationController {
  @Inject(ClsServiceAdapter)
  private readonly cls: ClsServiceAdapter;

  constructor(
    private readonly notificationService: NotificationService,

    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  @Post('create/notify/test')
  async createNotifyTest(
    @Body()
    body: {
      action: 'auctionStarted' | 'auctionBidWinned' | 'auctionFinished';
    },
  ) {
    const user = this.cls.get(USER_KEY) as UserDocument;

    if (!user || !user.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'You are not authorized to create a notification',
      );
    }

    // const auction = {
    //   _id: user['_id'],
    //   title: 'Test Auction',
    //   seller: user['_id'],
    //   bids: [],
    //   messages: [],
    //   views: 0,
    //   interestViews: 0,
    //   interestBids: 0,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    //   status: AuctionTypeEnum.ACTIVE,
    //   startAt: new Date(),
    //   endAt: new Date(),
    //   startedAt: new Date(),
    //   endedAt: new Date(),
    //   winner: user['_id'],
    //   attributes: [],
    // } as any;

    // try {
    //   switch (body.action) {
    //     case 'auctionStarted':
    //       return this.notificationService.auctionStarted({
    //         roomId: '123',
    //         type: NotificationType.AUCTION_STARTED,
    //         auction,
    //       });
    //     case 'auctionBidWinned':
    //       return this.notificationService.auctionBidWinned({
    //         roomId: '123',
    //         type: NotificationType.BID_WINNED,
    //         newBid: auction.bids.at(-1),
    //         userId: user['_id'].toString(),
    //         dealId: user['_id'].toString(),
    //       });
    //     case 'auctionFinished':
    //       return this.notificationService.auctionFinished({
    //         roomId: '123',
    //         type: NotificationType.AUCTION_FINISHED,
    //         auction,
    //       });
    //   }
    // } catch (error) {
    //   console.error(error);
    //   throw new BadRequestException(error.message);
    // }
  }
}

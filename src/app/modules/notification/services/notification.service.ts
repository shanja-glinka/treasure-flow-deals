import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepositoryToken } from '@root/src/app/core/constants';
import { IUserRepository } from '@root/src/app/modules/users/interfaces/user.repository.interface';
import { Queue } from 'bull';
import { NotificationEvent } from '../event/notification-create.event';
import { QueueProcessorNotification, QueueTaskNotifyUsersBulk } from '../types';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue(QueueProcessorNotification)
    private readonly queue: Queue,

    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  notifyUser(eventHandled: NotificationEvent | NotificationEvent[]) {
    this.queue.add(
      QueueTaskNotifyUsersBulk,
      Array.isArray(eventHandled) ? eventHandled : [eventHandled],
    );
  }

  // /**
  //  * Отправляет уведомление о начале аукциона продавцу.
  //  *
  //  * @param {AuctionRoomNotificationEvent | AuctionMessageNotificationEvent} eventHandled - Событие auction.started.
  //  * @returns {Promise<void>} - Promise<void>.
  //  */
  // async auctionStarted(
  //   eventHandled:
  //     | AuctionRoomNotificationEvent
  //     | AuctionMessageNotificationEvent,
  // ): Promise<void> {
  //   const targetUser =
  //     'auction' in eventHandled
  //       ? eventHandled.auction.seller
  //       : eventHandled.message.user;

  //   const targetUserId =
  //     typeof targetUser === 'string' ? targetUser : targetUser?._id.toString();
  //   const targetUserType =
  //     typeof targetUser === 'string'
  //       ? ValidatorHelper.validateObjectId(targetUser)
  //       : targetUser._id;

  //   const auctionTitle =
  //     'auction' in eventHandled ? eventHandled.auction.title : '';

  //   const event: NotificationEvent = new NotificationEvent(
  //     {
  //       userId: targetUserId,
  //       type: NotificationTypeEnum.REMIND,
  //       service: 'auction',
  //       eventKey: NotificationEventKey.AUCTION_STARTED,
  //       title: 'Аукцион начался',
  //       text: `Началась торговля аукционом ${auctionTitle}`.trim(),
  //       link: `/auctions/${eventHandled.roomId}`,
  //       metadata: {
  //         serviceSource: 'auction',
  //         entityTarget: 'seller',
  //       },
  //     },
  //     await this.userRepository.findOneBy({ _id: targetUserType }),
  //     null,
  //   );

  //   this.notifyUser(event);
  // }

  // async auctionBidWinned(
  //   eventHandled: AuctionBidNotificationEvent,
  // ): Promise<void> {
  //   const targetUser = await this.userRepository.findOneBy({
  //     _id: eventHandled.userId,
  //   });

  //   const text =
  //     `Поздравляем! Вы выиграли аукцион.` +
  //     (eventHandled?.newBid?.amount
  //       ? ` Последняя ставка аукциона составила: ${eventHandled.newBid.amount}`
  //       : ' ');
  //   const event: NotificationEvent = new NotificationEvent(
  //     {
  //       userId: targetUser._id.toString(),
  //       type: NotificationTypeEnum.HOT,
  //       service: 'auction',
  //       eventKey: NotificationEventKey.AUCTION_BID_WINNED,
  //       title: 'Вы выиграли аукцион',
  //       text,
  //       link: `/auctions/${eventHandled.roomId}`,
  //       metadata: {
  //         serviceSource: 'auction',
  //         entityTarget: 'user',
  //       },
  //     },
  //     targetUser,
  //     null,
  //   );

  //   this.notifyUser(event);
  // }

  // async auctionFinished(
  //   eventHandled: AuctionRoomNotificationEvent,
  // ): Promise<void> {
  //   const sellerTargetUser = await this.userRepository.findOneBy({
  //     _id: eventHandled.auction.seller?._id,
  //   });
  //   const winner =
  //     (await this.userRepository.findOneBy({
  //       _id: eventHandled.auction.winner?._id,
  //     })) ?? undefined;
  //   const winnerName = winner ? `${winner.name} ${winner.surname}` : undefined;

  //   const event: NotificationEvent = new NotificationEvent(
  //     {
  //       userId: sellerTargetUser._id.toString(),
  //       type: NotificationTypeEnum.HOT,
  //       service: 'auction',
  //       eventKey: NotificationEventKey.AUCTION_ENDED,
  //       title: 'Аукцион завершен',
  //       text: `Аукцион ${eventHandled.auction.title} завершен. ${winnerName ? `Победитель: ${winnerName}` : 'Сожалеем, но аукцион не был выигран.'}`,
  //       link: `/auctions/${eventHandled.auction._id.toString()}`,
  //       metadata: {
  //         serviceSource: 'auction',
  //         entityTarget: 'seller',
  //       },
  //     },
  //     sellerTargetUser,
  //     null,
  //   );

  //   const allExceptWinnerUsers = eventHandled.auction.bids.filter(
  //     (bid) => bid.user._id.toString() !== winner?._id.toString(),
  //   );

  //   this.notifyUser(event);

  //   const notifications = allExceptWinnerUsers.map(
  //     (user) =>
  //       new NotificationEvent(
  //         {
  //           userId: user.user._id.toString(),
  //           type: NotificationTypeEnum.MESSAGE,
  //           eventKey: NotificationEventKey.AUCTION_ENDED,
  //           service: 'auction',
  //           title: 'Аукцион завершен',
  //           text: `Аукцион ${eventHandled.auction.title} завершен. Ваша последняя ставка: ${user.amount}, последняя ставка победителя: ${eventHandled.auction.bids.at(-1).amount}`,
  //           link: `/auctions/${eventHandled.auction._id.toString()}`,
  //           metadata: {
  //             serviceSource: 'auction',
  //             entityTarget: 'user',
  //           },
  //         },
  //         user.user as any,
  //         null,
  //       ),
  //   );

  //   this.notifyUser(notifications);
  // }
}

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { redisConfiguration } from '@root/src/config/redis.config';
import {
  IDealMemoryManagerServiceToken,
  IDealRepositoryToken,
  IDealValidationServiceToken,
  IMessagesServiceToken,
  INotificationServiceToken,
} from '../../core/constants';
import {
  DealMessageLog,
  DealMessageLogSchema,
} from '../../core/schemas/deal-message-log.schema';
import { Deal, DealSchema } from '../../core/schemas/deal.schema';
import {
  UserCoinItem,
  UserCoinItemSchema,
} from '../../core/schemas/user-coin-item.schema';
import {
  UserCoinItemLog,
  UserCoinItemLogSchema,
} from '../../core/schemas/user-coin-item-log.schema';
import { Coin, CoinSchema } from '../../core/schemas/coin.schema';
import {
  CoinDealStat,
  CoinDealStatSchema,
} from '../../core/schemas/coin-deal-stat.schema';
import { UserModule } from '../users/user.module';
import { DealController } from './controllers/deal.controller';
import { DealGateway } from './gateway/deal.gateway';
import { DealEventsListener } from './listeners/deal-events.listeners';
import { DealProcessor } from './processors/deal.processor';
import { DealRepository } from './repositories/deal.repository';
import { DealScheduler } from './scheduler/deal.scheduler';
import { DealValidationService } from './services/deal-validation.service';
import { DealService } from './services/deal.service';
import { DealMemoryManagerService } from './services/management/deal-memory.management.service';
import { MessagesService } from './services/messages.service';
import { DealNotificationService } from './services/deal-notification.service';
import { QueueProcessorDeal } from './types';
import { DealViewBuilder } from './services/deal-view.builder';
import { DealStatsService } from './services/deal-stats.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: DealMessageLog.name, schema: DealMessageLogSchema },
      { name: CoinDealStat.name, schema: CoinDealStatSchema },
      { name: UserCoinItem.name, schema: UserCoinItemSchema },
      { name: UserCoinItemLog.name, schema: UserCoinItemLogSchema },
      { name: Coin.name, schema: CoinSchema },
    ]),
    ScheduleModule.forRoot(),
    NotificationModule,
    UserModule,
    BullModule.registerQueueAsync({
      name: QueueProcessorDeal,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) =>
        redisConfiguration(configService),
      inject: [ConfigService],
    }),
  ],
  providers: [
    DealEventsListener,
    DealGateway,
    DealService,
    DealScheduler,
    DealProcessor,
    DealViewBuilder,
    DealStatsService,
    {
      provide: IDealRepositoryToken,
      useClass: DealRepository,
    },
    {
      provide: IDealValidationServiceToken,
      useClass: DealValidationService,
    },
    {
      provide: IMessagesServiceToken,
      useClass: MessagesService,
    },
    {
      provide: IDealMemoryManagerServiceToken,
      useClass: DealMemoryManagerService,
    },
    {
      provide: INotificationServiceToken,
      useClass: DealNotificationService,
    },
  ],
  exports: [DealService],
  controllers: [DealController],
})
export class DealModule {}

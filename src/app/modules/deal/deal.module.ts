import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import {
  IDealRepositoryToken,
  IDealValidationServiceToken,
  IMessagesServiceToken,
  IDealMemoryManagerServiceToken,
} from '../../core/constants';
import { Deal, DealSchema } from '../../core/schemas/deal.schema';
import { UserModule } from '../users/user.module';
import { DealEventsListener } from './listeners/deal-events.listeners';
import { DealGateway } from './gateway/deal.gateway';
import { DealService } from './services/deal.service';
import { DealRepository } from './repositories/deal.repository';
import { DealValidationService } from './services/deal-validation.service';
import {
  DealMessageLog,
  DealMessageLogSchema,
} from '../../core/schemas/deal-message-log.schema';
import { DealScheduler } from './scheduler/deal.scheduler';
import { MessagesService } from './services/messages.service';
import { DealMemoryManagerService } from './services/management/deal-memory.management.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: DealMessageLog.name, schema: DealMessageLogSchema },
    ]),
    ScheduleModule.forRoot(),
    UserModule,
  ],
  providers: [
    DealEventsListener,
    DealGateway,
    DealService,
    DealScheduler,
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
  ],
  exports: [DealService],
})
export class DealModule {}

import { BullModule } from '@nestjs/bull';
import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfiguration } from '@root/src/config/redis.config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { UserModule } from '../users/user.module';
import { QueueProcessorNotification } from './types';

@Global()
@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: QueueProcessorNotification,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) =>
        redisConfiguration(configService),
      inject: [ConfigService],
    }),
    forwardRef(() => UserModule),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}

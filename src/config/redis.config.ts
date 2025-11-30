import { BullRootModuleOptions } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export const redisConfiguration = (
  configService: ConfigService,
): BullRootModuleOptions => {
  return {
    redis: {
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    },
  };
};

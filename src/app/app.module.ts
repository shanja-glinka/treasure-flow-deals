import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import mongoose from 'mongoose';
import { ClsModule } from 'nestjs-cls';
import { AppConfigModule } from '../config/app.config.module';
import { dbConfiguration } from '../config/database.config';
import { CoreModule } from './core.module';
import { ClsMiddleware } from './core/common/middlewares/cls.middleware';
import { JwtAuthGuard, RolesGuard } from './core/guards';
import { globalUpdateAtHook } from './core/hooks';
import { SharedModule } from './core/shared.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ClsModule.forRoot({
      global: true,
    }),
    AppConfigModule,
    CoreModule,
    SharedModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60, // The time-to-live for each request count record (in seconds)
        limit: 10, // The maximum number of requests allowed in the given time period
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        dbConfiguration(configService),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Глобальный Guard для аутентификации
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Глобальный Guard для ролей
    },
  ],
})
export class AppModule {
  constructor() {
    mongoose.plugin(globalUpdateAtHook);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

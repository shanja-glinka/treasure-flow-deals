import { Global, Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { applicationNamespace } from './core/common/middlewares/cls.middleware';
import { ClsNameSpaceProviderToken } from './core/constants';
import { LoggerService } from './core/middlewares';
import { ClsServiceAdapter } from './core/modules/cls/cls.service-adapter';
import { JwtStrategy } from './core/strategies/jwt.strategy';
import { AuctionModule } from './modules/auction/auction.module';
import { DealModule } from './modules/deal/deal.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/users/user.module';

const CLS_NAMESPACE_PROVIDER: Provider = {
  provide: ClsNameSpaceProviderToken,
  useFactory: () => applicationNamespace,
};

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NotificationModule,
    UserModule,
    AuctionModule,
    DealModule,
  ],
  providers: [CLS_NAMESPACE_PROVIDER, ClsServiceAdapter, LoggerService, JwtStrategy],
  exports: [ClsServiceAdapter, LoggerService],
})
export class CoreModule {}

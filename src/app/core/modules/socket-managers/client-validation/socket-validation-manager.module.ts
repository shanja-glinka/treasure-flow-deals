import { Global, Module } from '@nestjs/common';
import { ISocketValidationConnectionRepositoryToken } from '../../../constants';
import { SocketValidationConnectionRepository } from './socket-validation-connection.repository';

@Global()
@Module({
  providers: [
    {
      provide: ISocketValidationConnectionRepositoryToken,
      useClass: SocketValidationConnectionRepository,
    },
  ],
  exports: [ISocketValidationConnectionRepositoryToken],
})
export class SocketValidationManagerModule {}

import { Global, Module } from '@nestjs/common';
import { ISocketClientActivityRepositoryToken } from '../../../constants';
import { SocketActivityConnectionRepository } from './socket-activity-connection.repository';

@Global()
@Module({
  providers: [
    {
      provide: ISocketClientActivityRepositoryToken,
      useClass: SocketActivityConnectionRepository,
    },
  ],
  exports: [ISocketClientActivityRepositoryToken],
})
export class SocketActivityManagerModule {}

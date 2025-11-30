import { Global, Module } from '@nestjs/common';
import { ISocketStorageConnectionRepositoryToken } from '../../../constants';
import { SocketStorageConnectionRepository } from './socket-storage-connection.repository';

@Global()
@Module({
  providers: [
    {
      provide: ISocketStorageConnectionRepositoryToken,
      useClass: SocketStorageConnectionRepository,
    },
  ],
  exports: [ISocketStorageConnectionRepositoryToken],
})
export class SocketStorageManagerModule {}

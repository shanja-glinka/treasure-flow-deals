import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  IUserPublicServiceToken,
  IUserRepositoryToken,
} from '../../core/constants';
import { UserSchema } from '../../core/schemas/user.schema';
import { UserPublicService } from './services/user-public.service';
import { UserRepository } from './user.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
    {
      provide: IUserPublicServiceToken,
      useClass: UserPublicService,
    },
  ],
  exports: [IUserPublicServiceToken, IUserRepositoryToken],
})
export class UserModule {}

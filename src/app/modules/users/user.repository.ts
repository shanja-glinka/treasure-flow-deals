import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from './interfaces/user.repository.interface';
import { UserDocument } from '../../core/schemas/user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Находит пользователя по идентификатору.
   *
   * @param filter
   * @returns Документ пользователя или `null`, если не найден.
   */
  async findOneBy(filter: any): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }
}

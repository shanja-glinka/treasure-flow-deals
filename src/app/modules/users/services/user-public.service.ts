import { Inject, Injectable } from '@nestjs/common';
import { IUserRepositoryToken } from '@root/src/app/core/constants';
import { UserDocument } from '@root/src/app/core/schemas/user.schema';
import { IUserPublicService } from '../interfaces/user-public-service.interface';
import { IUserRepository } from '../interfaces/user.repository.interface';

@Injectable()
export class UserPublicService implements IUserPublicService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Находит пользователя по фильтру.
   *
   * @param filter - Фильтр поиска.
   * @returns Документ пользователя.
   */
  public async findOneBy(filter: any): Promise<UserDocument | null> {
    return this.userRepository.findOneBy(filter);
  }
}

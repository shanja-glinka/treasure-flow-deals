import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserPublicService } from '@root/src/app/modules/users/interfaces/user-public-service.interface';
import {
  IUserPublicServiceToken,
  USER_ID,
  USER_KEY,
} from '../../core/constants';
import { WhereFilterHelper } from '../../core/helpers';
import { User } from '../../core/schemas/user.schema';
import { ClsServiceAdapter } from '../../core/modules/cls/cls.service-adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IUserPublicServiceToken)
    private readonly userPublicService: IUserPublicService,

    private readonly clsServiceAdapter: ClsServiceAdapter,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await this.userPublicService.findOneBy(
      WhereFilterHelper.verifiedUserFilter({ _id: payload.sub }),
    );

    if (!user) {
      throw new UnauthorizedException(
        'User not found:' + process.env.JWT_SECRET
          ? 'ddd'
          : 'your_jwt_secret' + ':' + payload.sub,
      );
    }

    this.clsServiceAdapter.set(USER_KEY, user);
    this.clsServiceAdapter.set(USER_ID, user._id);

    return user;
  }
}

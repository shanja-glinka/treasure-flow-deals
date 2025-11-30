import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserPublicService } from '@root/src/app/modules/users/interfaces/user-public-service.interface';
import { Socket } from 'socket.io';
import { USER_ID, USER_KEY } from '../../constants';
import { ClsServiceAdapter } from '../../modules/cls/cls.service-adapter';
import { WhereFilterHelper } from '../helpers/where-filter.helper';
import { ValidatorHelper } from '../helpers/validator.helper';

@Injectable()
export class WsJwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WsJwtMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly clsServiceAdapter: ClsServiceAdapter,
    private readonly userPublicService: IUserPublicService,
  ) {}

  use(socket: Socket, next: (err?: Error) => void) {
    try {
      // Сначала пытаемся получить токен из заголовка Authorization
      let token = socket.handshake.headers.authorization?.split(' ')[1];

      // Если токен не найден в заголовках, ищем в куках
      if (!token) {
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
          // Парсим куки и ищем accessToken
          const cookieArray = cookies.split(';');
          for (const cookie of cookieArray) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'accessToken') {
              token = value;
              break;
            }
          }
        }
      }

      // Если токен не найден ни в заголовках, ни в куках
      if (!token) {
        throw new UnauthorizedException('Token not provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
      });

      const clsNamespace = this.clsServiceAdapter['cls'];
      clsNamespace.run(() => {
        this.userPublicService
          .findOneBy(
            WhereFilterHelper.verifiedUserFilter({
              _id: ValidatorHelper.validateObjectId(payload.sub),
            }),
          )
          .then((user) => {
            if (!user) {
              throw new UnauthorizedException('User not found');
            }

            // Устанавливаем данные в CLS
            this.clsServiceAdapter.set(USER_KEY, user);
            this.clsServiceAdapter.set(USER_ID, user._id);

            // Сохраняем пользователя в данных сокета
            socket.data.user = user;

            // Завершаем middleware
            next();
          })
          .catch((error) => {
            void error;
            this.logger.error(
              'Error finding user during WS authentication',
              error,
            );
            next(new UnauthorizedException('Invalid or expired token'));
          });
      });
    } catch (error) {
      this.logger.error('Error in WS JWT middleware', error);
      next(new UnauthorizedException('Invalid or expired token'));
    }
  }
}

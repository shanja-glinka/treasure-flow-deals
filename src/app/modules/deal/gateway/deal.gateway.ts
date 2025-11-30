import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { applicationNamespace } from '@root/src/app/core/common/middlewares/cls.middleware';
import { WsJwtMiddleware } from '@root/src/app/core/common/middlewares/ws-jwt.middleware';
import {
  GlobalAuctionNamespace,
  IDealMemoryManagerServiceToken,
  IDealValidationServiceToken,
  IMessagesServiceToken,
  IUserPublicServiceToken,
  SocketEventMaxConnectionsExceeded,
  USER_ID,
} from '@root/src/app/core/constants';
import {
  SocketResponseHelper,
  ValidatorHelper,
} from '@root/src/app/core/helpers';
import { ClsServiceAdapter } from '@root/src/app/core/modules/cls/cls.service-adapter';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { Role, UserShortData } from '@root/src/app/core/schemas/user.schema';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { IUserPublicService } from '../../users/interfaces/user-public-service.interface';
import { AddMessageReactionDto } from '../dto/add-message-reaction.dto';
import { AddMessageDto } from '../dto/add-message.dto';
import {
  IDealValidationService,
  IMessagesService,
} from '../interfaces/deal.interfaces';
import { IDealMemoryManagerService } from '../interfaces/memory-manager.service.interface';
import { DealService } from '../services/deal.service';
import {
  DealCounterOfferDto,
  DealCounterOfferResponseDto,
  DealDisputeDto,
} from '../dto/deal-action.dto';
import { IsMongoId } from 'class-validator';

/**
 * Декоратор создает новый контекст для работы рест функций.
 *
 * Алгоритм работы:
 * 1. Создает новый контекст CLS для выполнения обработчика с помощью `applicationNamespace.run()`.
 * 2. Внутри нового CLS-контекста:
 *    a. Если у сокета есть данные `clientWrap` (хранящиеся в `socket.data.clientWrap`),
 *       перебирает все пары ключ-значение и устанавливает их в текущий CLS-контекст через `this.cls.set(key, value)`.
 *    b. Вызывает оригинальный метод обработчика (с сохранением контекста `this` и переданных аргументов).
 *    c. Результат выполнения метода возвращается через resolve Promise.
 *
 * Примечания:
 * - Этот декоратор предполагает, что класс, в котором он применяется (например, гейтвей),
 *   имеет инжектированное свойство `cls` (экземпляр ClsServiceAdapter).
 * - Декоратор гарантирует, что обработчик выполняется в новом CLS-контексте, чтобы обеспечить изоляцию данных,
 *   установленных в `socket.data.clientWrap`.
 */
// eslint-disable-next-line
export function WithClientContext() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Оборачиваем выполнение в новый контекст CLS
      return await new Promise((resolve, reject) => {
        applicationNamespace.run(async () => {
          try {
            // Ищем объект Socket (например, по наличию handshake)
            const socket = args.find((arg) => arg && arg.handshake);
            if (socket && socket.data && socket.data.clientWrap) {
              const clientWrap = socket.data.clientWrap;
              // Устанавливаем данные из clientWrap в CLS через this.cls
              for (const [key, value] of Object.entries(clientWrap)) {
                this.cls.set(key, value);
              }
            } else {
            }
            const result = await originalMethod.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    };
    return descriptor;
  };
}

class DealIdPayload {
  @IsMongoId()
  dealId: string;
}

class DealDisputePayload extends DealDisputeDto {
  @IsMongoId()
  dealId: string;
}

class DealCounterOfferPayload extends DealCounterOfferDto {
  @IsMongoId()
  dealId: string;
}

class DealCounterOfferRespondPayload extends DealCounterOfferResponseDto {
  @IsMongoId()
  dealId: string;

  @IsMongoId()
  counterOfferId: string;
}

@WebSocketGateway({
  namespace: '/deal',
  cors: {
    origin: '*',
  },
})
export class DealGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  /**
   * Количество одновременных соединений
   *
   * @type {number}
   */
  public readonly connectionsLimit = 5;

  private readonly logger = new Logger(DealGateway.name);

  /**
   * userActivity хранит отметку времени последней активности для
   * ключа (userId + '_' + dealId).
   */
  private userActivity = new Map<string, number>();

  /**
   * userSockets: хранит для каждого userId множество socket.id (в порядке прихода).
   * Нужно, чтобы ограничить общее кол-во подключений до connectionsLimit.
   */
  private userSockets = new Map<string, string[]>();
  private readonly messageWindowMs = 10 * 1000;
  private readonly messageLimit = 5;
  private readonly messageBuckets = new Map<string, number[]>();

  constructor(
    @Inject(IMessagesServiceToken)
    private readonly messagesService: IMessagesService,

    @Inject(IDealMemoryManagerServiceToken)
    private readonly dealManagerService: IDealMemoryManagerService,

    @Inject(IUserPublicServiceToken)
    private readonly userPublicService: IUserPublicService,

    @Inject(IDealValidationServiceToken)
    private readonly validationService: IDealValidationService,

    private readonly dealService: DealService,

    private readonly clsServiceAdapter: ClsServiceAdapter,
  ) {}

  /***************************************************************************
   * GATEWAY HOOKS
   ***************************************************************************/

  public afterInit(server: Server) {
    // server.use((socket, next) => {
    //   if (socket.nsp.name !== '/deal') {
    //     return next(new Error('Unauthorized namespace'));
    //   }
    //   next();
    // });
    // Подключаем JWT Middleware с CLS
    server.use((socket, next) =>
      new WsJwtMiddleware(
        new JwtService(),
        this.clsServiceAdapter,
        this.userPublicService,
      ).use(socket, next),
    );
  }

  /**
   * Пользователь подключается к сокету:
   * - Извлекаем параметры.
   * - Находим аукцион.
   * - Проверяем, можно ли подключаться (за 30 мин до начала и до завершения).
   * - Валидируем пользователя.
   * - Подключаем к комнате.
   * - Запускаем трекинг активности и периодическую валидацию.
   */
  public async handleConnection(client: Socket) {
    try {
      const { dealId, userId, globalMode } =
        this.extractConnectionParams(client);

      // Привязываем userId к клиенту (на будущее для handleDisconnect)
      client.data.userId = userId;
      client.data.dealId = dealId;

      // Не даём больше this.connectionsLimit соединений: закрываем одно из старых
      this.ensureConnectionLimit(userId, client);

      if (globalMode) {
        // Режим "глобальный" (просмотр списка)
        client.join(GlobalAuctionNamespace);
        this.logger.log(
          `User ${userId} connected in GLOBAL mode (socket=${client.id}).`,
        );
      } else {
        // Режим "конкретного аукциона"
        if (!dealId) {
          throw new BadRequestException('Не указан dealId');
        }

        const deal = await this.findDeal(dealId);
        this.checkDealRoomAllowed(deal);
        await this.validateUserInDeal(dealId, userId);

        // Заходим в "комнату" аукциона
        client.join(dealId);
        this.dealManagerService.registerOnline(dealId, userId);
        this.dealManagerService.touch(dealId);

        // Для наглядности
        this.logger.log(
          `Client connected: ${client.id} (userId=${userId}, dealId=${dealId})`,
        );

        // Включаем трекинг активности + периодическую валидацию
        this.refreshUserActivity(client, userId, dealId);
        this.startValidationInterval(client, dealId, userId);
      }

      // В любом случае, подключаем к комнате userId, чтобы
      // notifyUser(userId) доставалось всем сокетам пользователя
      client.join(userId);
    } catch (e) {
      const statusCode = e instanceof HttpException ? e.getStatus() : 500;
      SocketResponseHelper.sendErrorResponse(client, statusCode, e.message);
      client.disconnect(true);
    }
  }

  /**
   * Пользователь отключился.
   * (Сокет сам выйдет из комнаты).
   */
  public async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = client.data.userId as string;
    const dealId = client.data.dealId as string | undefined;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        const idx = sockets.indexOf(client.id);
        if (idx >= 0) {
          sockets.splice(idx, 1);
        }
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    if (dealId) {
      this.dealManagerService.unregisterOnline(dealId, userId);
    }
  }

  /***************************************************************************
   * ЛОГИКА ОГРАНИЧЕНИЯ ЧИСЛА ПОДКЛЮЧЕНИЙ
   ***************************************************************************/

  /**
   * Если у пользователя уже connectionsLimit сокета, закрываем один (самый старый).
   * Затем добавляем текущий socket.id в userSockets[userId].
   */
  private ensureConnectionLimit(userId: string, client: Socket): void {
    let sockets = this.userSockets.get(userId);
    if (!sockets) {
      sockets = [];
      this.userSockets.set(userId, sockets);
    }

    // Если уже connectionsLimit, тогда закрываем "старый" (с нулевого индекса)
    if (sockets.length >= this.connectionsLimit) {
      const oldestSocketId = sockets.shift(); // удаляем из массива
      if (oldestSocketId) {
        // Оповещаем старый сокет, что он закрыт
        this.server.to(oldestSocketId).emit(SocketEventMaxConnectionsExceeded, {
          reason: 'Вы были отключены, т.к. зашли с другого устройства',
        });

        // Закрываем
        const oldSocket = this.server.sockets.sockets.get(oldestSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
        this.logger.warn(
          `User ${userId} reached max connections (${this.connectionsLimit}). Kicking oldest socket=${oldestSocketId}`,
        );
      }
    }

    // Добавляем новый сокет
    sockets.push(client.id);
    this.userSockets.set(userId, sockets);
  }

  /***************************************************************************
   * ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
   ***************************************************************************/

  private extractConnectionParams(client: Socket): {
    dealId?: string;
    userId: string;
    globalMode: boolean;
  } {
    const { dealId } = client.handshake.query as {
      dealId?: string;
    };

    const userIdObj = this.clsServiceAdapter.get<Types.ObjectId>(USER_ID);
    if (!userIdObj) {
      throw new BadRequestException('Пользователь не авторизован');
    }
    const userId = userIdObj.toString();

    const isGlobalMode = typeof dealId === 'undefined';
    return { dealId, userId, globalMode: isGlobalMode };
  }

  private async findDeal(dealId: string): Promise<DealDocument> {
    return this.dealManagerService.get(dealId);
  }

  /**
   * Проверяем, доступна ли комната (за 30 минут до начала, не завершён).
   * Если нет — бросаем ошибку.
   */
  private checkDealRoomAllowed(deal: DealDocument) {
    void deal;
    const allowed = true;
    if (!allowed) {
      throw new NotFoundException(
        'Комната недоступна (либо ещё не наступило время, либо аукцион завершён)',
      );
    }
  }

  /**
   * Валидируем пользователя для участия в аукционе.
   * Если нельзя — бросаем ошибку.
   */
  private async validateUserInDeal(dealId: string, userId: string) {
    const canJoin = await this.validationService.validateUserInDeal(
      dealId,
      userId,
    );
    if (!canJoin) {
      throw new ForbiddenException('Участие в аукционе запрещено');
    }
  }

  /**
   * Метод для обновления "последней активности" пользователя.
   */
  private refreshUserActivity(client: Socket, userId: string, dealId: string) {
    const key = `${userId}_${dealId}`;
    this.userActivity.set(key, Date.now());
    this.dealManagerService.touch(dealId);
    this.scheduleInactivityCheck(client, userId, dealId, key);
  }

  /**
   * Планируем проверку неактивности через 10 минут. Если разрыв >= 10 мин,
   * отключаем пользователя.
   */
  private scheduleInactivityCheck(
    client: Socket,
    userId: string,
    dealId: string,
    key: string,
  ) {
    setTimeout(
      () => {
        const last = this.userActivity.get(key);
        if (!last) return;
        const diff = Date.now() - last;
        if (diff >= 10 * 60 * 1000) {
          // пользователь не активен >= 10 минут, отключаем
          client.leave(dealId);
          client.disconnect(true);
          this.userActivity.delete(key);
          this.logger.log(
            `Отключили клиента (userId=${userId}) за неактивность`,
          );
        }
      },
      10 * 60 * 1000,
    );
  }

  /**
   * Периодическая валидация пользователя раз в 10 минут.
   * Если проверка провалилась — отключаем.
   */
  private startValidationInterval(
    client: Socket,
    dealId: string,
    userId: string,
  ) {
    const interval = setInterval(
      async () => {
        const stillValid = await this.validationService.validateUserInDeal(
          dealId,
          userId,
        );
        if (!stillValid) {
          client.emit('error', {
            message: 'Валидация не пройдена. Подключение закрыто.',
          });
          client.disconnect(true);
          clearInterval(interval);
        }
      },
      10 * 60 * 1000,
    );

    client.on('disconnect', () => {
      clearInterval(interval);
    });
  }

  /**
   * Возвращает UserId
   *
   * @param asString
   * @returns
   */
  private getShortUser(client: Socket): UserShortData {
    const user = client.data.user;
    return {
      _id: user._id,
      username: user.username ?? user.name ?? user.email,
      email: user.email,
      imageId: user.imageId,
      roles: user.roles ?? [Role.USER],
    };
  }

  private getUserId(client: Socket): string {
    const user = client.data.user;
    const userId = user?._id?.toString?.();
    if (!userId) {
      throw new UnauthorizedException('User is not authorized');
    }
    return userId;
  }

  private assertMessageRate(userId: string): void {
    const now = Date.now();
    const windowStart = now - this.messageWindowMs;
    const bucket = this.messageBuckets.get(userId) ?? [];
    const recent = bucket.filter((ts) => ts >= windowStart);
    if (recent.length >= this.messageLimit) {
      throw new ForbiddenException(
        'Слишком много сообщений. Попробуйте чуть позже.',
      );
    }
    recent.push(now);
    this.messageBuckets.set(userId, recent);
  }

  /***************************************************************************
   * СОБЫТИЯ ОТ КЛИЕНТА
   ***************************************************************************/

  @SubscribeMessage('sendMessage')
  public async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AddMessageDto,
  ) {
    try {
      await ValidatorHelper.validateDto(AddMessageDto, data);

      data.user = this.getShortUser(client);
      data.userId = data.user._id.toString();
      this.assertMessageRate(data.userId);

      await this.messagesService.addMessage(data);

      this.refreshUserActivity(client, data.userId, data.dealId);
      this.dealManagerService.touch(data.dealId);

      return SocketResponseHelper.sendSuccessResponse(client, {
        message: 'Сообщение успешно зарегистрировано',
        data: { dealId: data.dealId },
      });
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
  }

  @SubscribeMessage('addReaction')
  public async onAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AddMessageReactionDto,
  ) {
    try {
      await ValidatorHelper.validateDto(AddMessageReactionDto, data);

      data.user = this.getShortUser(client);
      data.userId = data.user._id.toString();

      await this.messagesService.addReaction(data);

      this.refreshUserActivity(client, data.userId, data.dealId);
      this.dealManagerService.touch(data.dealId);

      return SocketResponseHelper.sendSuccessResponse(client, {
        message: 'Реакция успешно зарегистрирована',
        data: { dealId: data.dealId },
      });
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
  }

  @SubscribeMessage('deal.start')
  async handleStartDeal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) => this.dealService.startDealFlow(dealId, userId),
    );
  }

  @SubscribeMessage('deal.buyerConfirmPayment')
  async handleBuyerPayment(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) => this.dealService.buyerConfirmPayment(dealId, userId),
    );
  }

  @SubscribeMessage('deal.sellerConfirmDelivery')
  async handleSellerDelivery(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) =>
        this.dealService.sellerConfirmDelivery(dealId, userId),
    );
  }

  @SubscribeMessage('deal.buyerConfirmAcceptance')
  async handleBuyerAcceptance(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) =>
        this.dealService.buyerConfirmAcceptance(dealId, userId),
    );
  }

  @SubscribeMessage('deal.close')
  async handleCloseDeal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) => this.dealService.closeDeal(dealId, userId),
    );
  }

  @SubscribeMessage('deal.cancel')
  async handleCancelDeal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealIdPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealIdPayload, payload);
    } catch (e) {
      // console.log('handleCancelDeal error', e);
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    const result = await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) => this.dealService.cancelDeal(dealId, userId),
    );

    return result;
  }

  @SubscribeMessage('deal.dispute')
  async handleDispute(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealDisputePayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealDisputePayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) =>
        this.dealService.openDispute(dealId, userId, payload.reason),
    );
  }

  @SubscribeMessage('deal.counterOffer')
  async handleCounterOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealCounterOfferPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(DealCounterOfferPayload, payload);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }

    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) =>
        this.dealService.createCounterOffer(
          dealId,
          userId,
          payload.price,
          payload.message,
        ),
    );
  }

  @SubscribeMessage('deal.counterOfferRespond')
  async handleCounterOfferRespond(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DealCounterOfferRespondPayload,
  ) {
    try {
      await ValidatorHelper.validateDto(
        DealCounterOfferRespondPayload,
        payload,
      );
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }

    return await this.executeDealAction(
      client,
      payload.dealId,
      (dealId, userId) =>
        this.dealService.respondCounterOffer(
          dealId,
          userId,
          payload.counterOfferId,
          payload.accept,
        ),
    );
  }

  private async executeDealAction(
    client: Socket,
    dealId: string,
    action: (dealId: string, actorId: string) => Promise<DealDocument>,
  ) {
    const actorId = this.getUserId(client);
    try {
      const deal = await action(dealId, actorId);

      this.dealManagerService.touch(dealId);

      return SocketResponseHelper.sendSuccessResponse(client, deal);
    } catch (e) {
      return SocketResponseHelper.sendErrorResponse(client, e);
    }
  }
}

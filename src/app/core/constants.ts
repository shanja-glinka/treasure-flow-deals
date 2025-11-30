export const DateRegExp = /^\d{4}-\d{2}-\d{2}$/;

export const USER_ID = 'UserIdCls';
export const USER_KEY = 'UserEntityCls';
export const USER_SOCKET_ID = 'UserSocketIdCls';

export const ClsNameSpaceProviderToken = 'CLS_NAMESPACE';

export const ResponseMessage = {
  OK: 'OK!',
};

export const ApplicationNamespace = 'AppNamespace';

export const GlobalAuctionNamespace = 'globalAuctions';

export const PASSWORD_SALT = 10;

export const EntityNotFoundMessage = 'Сущность не найдена.';

export const IUserRepositoryToken = Symbol('IUserRepository');
export const IUserPublicServiceToken = Symbol('IUserPublicService');
export const IAuctionRepositoryToken = Symbol('IAuctionRepository');
export const IAuctionValidatorToken = Symbol('IAuctionValidator');
export const IAuctionValidationServiceToken = Symbol(
  'IAuctionValidationService',
);
export const IAuctionMemoryManagerServiceToken = Symbol(
  'IAuctionMemoryManagerService',
);
export const IBidsServiceToken = Symbol('IBidsService');
export const IMessagesServiceToken = Symbol('IMessagesService');
export const IInterestActivityServiceToken = Symbol('IInterestActivityService');
export const INotificationServiceToken = Symbol('INotificationService');

export const IDealValidatorToken = Symbol('IDealValidatorToken');
export const IDealRepositoryToken = Symbol('IDealRepository');
export const IDealValidationServiceToken = Symbol('IDealValidationService');
export const IDealMessagesServiceToken = Symbol('IDealMessagesService');
export const IDealNotificationServiceToken = Symbol('IDealNotificationService');
export const IDealMemoryManagerServiceToken = Symbol(
  'IDealMemoryManagerService',
);

export const IQueueProcessorServiceToken = Symbol('IQueueProcessorService');

export const EventAuctionStarted = Symbol('auction.started');
export const EventAuctionEnded = Symbol('auction.ended');
export const EventAuctionChanged = Symbol('auction.changed');
export const EventAuctionBidOverridden = Symbol('auction.bid.overridden');
export const EventAuctionBidWinned = Symbol('auction.bid.winned');
export const EventAuctionMessageAdded = Symbol('auction.message.added');
export const EventAuctionMessageRemoved = Symbol('auction.message.removed');
export const EventAuctionReactionAdded = Symbol('auction.reaction.added');
export const EventAuctionReactionRemoved = Symbol('auction.reaction.removed');

export const EventDealChanged = Symbol('deal.changed');
export const EventDealMessageAdded = Symbol('deal.message.added');
export const EventDealMessageRemoved = Symbol('deal.message.removed');
export const EventDealReactionAdded = Symbol('deal.reaction.added');
export const EventDealReactionRemoved = Symbol('deal.reaction.removed');
export const EventDealFinished = Symbol('deal.finished');
export const EventDealCreated = Symbol('deal.created');

export const SocketEventBidOverridden = 'bidOverridden';
export const SocketEventBidWinned = 'bidWinned';
export const SocketEventAuctionStarted = 'auctionStarted';
export const SocketEventAuctionUpdated = 'auctionUpdated';
export const SocketEventAuctionFinished = 'auctionFinished';
export const SocketEventAuctionExtended = 'auctionExtended';
export const SocketEventAuctionMessageReaction = 'auctionMessageReaction';
export const SocketEventMaxConnectionsExceeded = 'maxConnectionsExceeded';
export const SocketEventAuctionListUpdate = 'auctionListUpdate';

export const SocketEventDealStarted = 'auctionStarted';
export const SocketEventDealUpdated = 'dealUpdated';
export const SocketEventDealFinished = 'dealFinished';
export const SocketEventDealMessageReaction = 'dealMessageReaction';

// SOCKET STORAGE MODULE
export const ISocketStorageConnectionRepositoryToken = Symbol(
  'ISocketStorageConnectionRepository',
);
export const ISocketClientActivityRepositoryToken = Symbol(
  'ISocketClientActivityRepository',
);
export const ISocketValidationConnectionRepositoryToken = Symbol(
  'ISocketValidationConnectionRepository',
);

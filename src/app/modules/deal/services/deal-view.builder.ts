import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { IUserRepositoryToken } from '@root/src/app/core/constants';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { Role, UserShortData } from '@root/src/app/core/schemas/user.schema';
import { IUserRepository } from '../../users/interfaces/user.repository.interface';

export type DealParticipantRole = 'seller' | 'buyer' | 'admin';

export interface DealParticipant extends UserShortData {
  participantRole: DealParticipantRole;
}

@Injectable()
export class DealViewBuilder {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  public async build(deal: DealDocument): Promise<any> {
    const base =
      typeof deal.toObject === 'function'
        ? deal.toObject({ virtuals: true })
        : (deal as any);

    const seller = await this.resolveUser(deal.seller);
    const buyer = await this.resolveUser(deal.buyer);

    base.seller = seller;
    base.buyer = buyer;

    if (base.dispute?.assignedTo) {
      base.dispute.assignedTo = await this.resolveUser(base.dispute.assignedTo);
    }

    if (!Array.isArray(base.messages)) {
      base.messages = [];
    }

    base.chat =
      base.chat ??
      ({
        totalMessages: base.messages.length,
        buyerUnread: 0,
        sellerUnread: 0,
        lastMessageAt:
          base.messages.length > 0
            ? base.messages[base.messages.length - 1].createdAt
            : null,
      } as any);

    const participants = await this.resolveParticipants(deal, seller, buyer);
    base.participants = participants;
    return base;
  }

  private async resolveParticipants(
    deal: DealDocument,
    seller?: UserShortData | null,
    buyer?: UserShortData | null,
  ): Promise<DealParticipant[]> {
    const participants: DealParticipant[] = [];

    if (!seller) {
      seller = await this.resolveUser(deal.seller);
    }
    if (seller) {
      participants.push({ ...seller, participantRole: 'seller' });
    }

    if (!buyer) {
      buyer = await this.resolveUser(deal.buyer);
    }
    if (buyer) {
      participants.push({ ...buyer, participantRole: 'buyer' });
    }

    const adminId = this.extractObjectId(deal.dispute?.assignedTo);
    if (adminId) {
      const admin = await this.resolveUser(adminId);
      if (admin) {
        if (!admin.roles?.includes(Role.ADMIN)) {
          admin.roles = [...(admin.roles ?? []), Role.ADMIN];
        }
        participants.push({ ...admin, participantRole: 'admin' });
      }
    }

    return participants;
  }

  private async resolveUser(
    source: Types.ObjectId | { _id?: Types.ObjectId } | UserShortData | null,
  ): Promise<UserShortData | null> {
    if (!source) {
      return null;
    }

    if ((source as UserShortData).username) {
      return this.normalizeShortData(source as UserShortData);
    }

    const objectId = this.extractObjectId(source);
    if (!objectId) {
      return null;
    }

    const user = await this.userRepository.findOneBy({ _id: objectId });
    return user
      ? this.normalizeShortData({
          _id: user._id,
          username: (user as any).username ?? user.name ?? user.email,
          email: user.email,
          imageId: (user as any).imageId ?? null,
          roles: user.roles ?? [],
        })
      : null;
  }

  private normalizeShortData(user: UserShortData): UserShortData {
    return {
      _id: this.extractObjectId(user._id) ?? (user._id as Types.ObjectId),
      username: user.username ?? user.email,
      email: user.email,
      imageId: user.imageId ?? null,
      roles: user.roles ?? [],
    };
  }

  private extractObjectId(
    value:
      | Types.ObjectId
      | { _id?: Types.ObjectId }
      | string
      | null
      | undefined,
  ): Types.ObjectId | null {
    if (!value) {
      return null;
    }
    if (value instanceof Types.ObjectId) {
      return value;
    }
    if (typeof value === 'string') {
      return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
    }
    if ((value as any)?._id) {
      return this.extractObjectId((value as any)._id);
    }
    return null;
  }
}

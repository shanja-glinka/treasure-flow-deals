import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { IDealRepositoryToken } from '@root/src/app/core/constants';
import { DealDocument } from '@root/src/app/core/schemas/deal.schema';
import { IDealRepository } from '../../interfaces/deal.repository.interface';
import {
  DealMemoryEntry,
  IDealMemoryManagerService,
} from '../../interfaces/memory-manager.service.interface';

interface DealState {
  deal: DealDocument;
  changed: boolean;
  lastActivityAt: number;
  onlineUsers: Set<string>;
  lastSyncedAt: number;
}

@Injectable()
export class DealMemoryManagerService implements IDealMemoryManagerService {
  private readonly store = new Map<string, DealState>();

  constructor(
    @Inject(IDealRepositoryToken)
    private readonly dealRepository: IDealRepository,
  ) {}

  public async get(dealId: string | Types.ObjectId): Promise<DealDocument> {
    const key = dealId.toString();
    let state = this.store.get(key);

    if (!state) {
      const deal = (await this.dealRepository.findById(
        dealId,
        true,
        true,
      )) as DealDocument | null;

      if (!deal) {
        throw new NotFoundException('Deal not found');
      }

      state = {
        deal,
        changed: false,
        lastActivityAt: Date.now(),
        onlineUsers: new Set<string>(),
        lastSyncedAt: Date.now(),
      };
      this.store.set(key, state);
    } else {
      state.lastActivityAt = Date.now();
    }

    return state.deal;
  }

  public set(deal: DealDocument, markChanged = true): void {
    const key = deal._id.toString();
    const current = this.store.get(key);

    const state: DealState = current ?? {
      deal,
      changed: false,
      lastActivityAt: Date.now(),
      onlineUsers: new Set<string>(),
      lastSyncedAt: Date.now(),
    };

    state.deal = deal;
    state.lastActivityAt = Date.now();
    if (markChanged) {
      state.changed = true;
    }

    this.store.set(key, state);
  }

  public markChanged(dealId: string | Types.ObjectId): void {
    const state = this.store.get(dealId.toString());
    if (state) {
      state.changed = true;
    }
  }

  public getAllChanged(): DealDocument[] {
    return Array.from(this.store.values())
      .filter((state) => state.changed)
      .map((state) => state.deal);
  }

  public resetAllChangedFlags(): void {
    for (const state of this.store.values()) {
      state.changed = false;
      state.lastSyncedAt = Date.now();
    }
  }

  public markSynced(dealId: string | Types.ObjectId): void {
    const state = this.store.get(dealId.toString());
    if (state) {
      state.changed = false;
      state.lastSyncedAt = Date.now();
    }
  }

  public getAll(): DealDocument[] {
    return Array.from(this.store.values()).map((state) => state.deal);
  }

  public remove(dealId: string | Types.ObjectId): void {
    this.store.delete(dealId.toString());
  }

  public touch(dealId: string | Types.ObjectId): void {
    const state = this.store.get(dealId.toString());
    if (state) {
      state.lastActivityAt = Date.now();
    }
  }

  public registerOnline(
    dealId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): void {
    const state = this.store.get(dealId.toString());
    if (state) {
      state.onlineUsers.add(userId.toString());
      state.lastActivityAt = Date.now();
    }
  }

  public unregisterOnline(
    dealId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): void {
    const state = this.store.get(dealId.toString());
    if (state) {
      state.onlineUsers.delete(userId.toString());
    }
  }

  public getOnlineParticipants(dealId: string | Types.ObjectId): string[] {
    const state = this.store.get(dealId.toString());
    return state ? Array.from(state.onlineUsers.values()) : [];
  }

  public getStaleEntries(maxIdleMs: number): DealMemoryEntry[] {
    const now = Date.now();
    const entries: DealMemoryEntry[] = [];

    for (const state of this.store.values()) {
      const idleTime = now - state.lastActivityAt;
      if (idleTime >= maxIdleMs || state.onlineUsers.size === 0) {
        entries.push({
          deal: state.deal,
          changed: state.changed,
          lastActivityAt: state.lastActivityAt,
          onlineUserIds: Array.from(state.onlineUsers.values()),
        });
      }
    }

    return entries;
  }
}

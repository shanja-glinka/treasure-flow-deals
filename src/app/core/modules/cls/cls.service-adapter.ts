import { Inject, Injectable, Scope } from '@nestjs/common';
import { ClsNamespace } from 'cls-hooked';
import { ClsNameSpaceProviderToken } from '../../constants';

@Injectable({ scope: Scope.TRANSIENT }) // Транзиентный - новый экземпляр для каждого запроса
export class ClsServiceAdapter {
  constructor(
    @Inject(ClsNameSpaceProviderToken)
    private readonly cls: ClsNamespace,
  ) {}

  set(key: string, value: any) {
    this.cls.set(key, value);
  }

  get<T>(key: string): T {
    return this.cls.get(key);
  }
}

import { SetMetadata } from '@nestjs/common';
export type AuthorizationScope = 'TO_CHUC' | 'KHU_TRO';
export const AUTHORIZATION_SCOPE = 'authorization_scope';
export const Scope = (scope: AuthorizationScope) =>
  SetMetadata(AUTHORIZATION_SCOPE, scope);

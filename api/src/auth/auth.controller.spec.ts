import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller';

describe('AuthController HTTP semantics', () => {
  const handler = (name: string): unknown =>
    Object.getOwnPropertyDescriptor(AuthController.prototype, name)?.value;

  it.each(['login', 'refresh', 'logout'] as const)(
    'returns HTTP 200 for %s',
    (method) => {
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler(method))).toBe(
        200,
      );
    },
  );

  it('keeps register at the NestJS POST default', () => {
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, handler('register')),
    ).toBeUndefined();
  });
});

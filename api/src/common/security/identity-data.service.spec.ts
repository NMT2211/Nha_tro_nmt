import { ConfigService } from '@nestjs/config';
import { IdentityDataService } from './identity-data.service';
describe('IdentityDataService', () => {
  const key = Buffer.alloc(32, 7).toString('base64');
  const service = new IdentityDataService({
    get: () => key,
  } as unknown as ConfigService);
  it('round trips compatible v1 ciphertext', () => {
    const protectedValue = service.protect(' 012345678900 ');
    expect(protectedValue.soGiayToMaHoa).toMatch(/^v1\./);
    expect(service.decrypt(protectedValue.soGiayToMaHoa)).toBe('012345678900');
  });
  it('rejects malformed ciphertext', () =>
    expect(() => service.decrypt('v1.invalid')).toThrow('Không thể giải mã'));
  it.each([
    'v2.YWJj.YWJj.YWJj',
    'v1.***.YWJj.YWJj',
    'v1.YWJj.YWJj.YWJj',
    `v1.${Buffer.alloc(12).toString('base64url')}.${Buffer.alloc(16, 1).toString('base64url')}.YWJj`,
  ])('fails closed for invalid ciphertext %s', (ciphertext) => {
    expect(() => service.decrypt(ciphertext)).toThrow('Không thể giải mã');
  });
  it('fails closed when key is missing', () => {
    const missing = new IdentityDataService({
      get: () => undefined,
    } as unknown as ConfigService);
    expect(() => missing.protect('1234')).toThrow('Khóa mã hóa');
  });
  it('fails closed with invalid key', () => {
    const invalid = new IdentityDataService({
      get: () => 'bad',
    } as unknown as ConfigService);
    expect(() => invalid.protect('1234')).toThrow('Khóa mã hóa');
  });
});

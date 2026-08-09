import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  it('hashes and verifies a password without retaining plaintext', async () => {
    const hash = await service.hash('StrongPassword123');
    expect(hash).not.toBe('StrongPassword123');
    await expect(service.verify(hash, 'StrongPassword123')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });
});

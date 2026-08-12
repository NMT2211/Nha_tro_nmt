import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { KhuTroQueryDto } from './khu-tro-query.dto';

describe('KhuTroQueryDto', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  const transform = (value: object) =>
    pipe.transform(value, { type: 'query', metatype: KhuTroQueryDto });

  it('accepts pagination without search', async () => {
    await expect(transform({ page: '1', limit: '20' })).resolves.toMatchObject({
      page: 1,
      limit: 20,
    });
  });

  it('accepts and trims valid search', async () => {
    await expect(transform({ search: '  Khu A  ' })).resolves.toMatchObject({
      search: 'Khu A',
    });
  });

  it('accepts empty search as no effective search', async () => {
    await expect(transform({ search: '   ' })).resolves.toMatchObject({
      search: '',
    });
  });

  it('rejects unknown query properties', async () => {
    try {
      await transform({ property: 'Khu A' });
      fail('Expected validation to reject the unknown property');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response: unknown = (error as BadRequestException).getResponse();
      expect(response).toHaveProperty('message');
      const messages = (response as { message: unknown }).message;
      expect(Array.isArray(messages) ? messages : []).toContain(
        'property property should not exist',
      );
    }
  });
});

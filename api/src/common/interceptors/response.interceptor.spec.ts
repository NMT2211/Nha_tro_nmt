import { Prisma } from '../../../generated/prisma/client';
import { serializePrismaValues } from './response.interceptor';

describe('serializePrismaValues', () => {
  it('serializes nested BigInt and Decimal values without exposing internals', () => {
    expect(
      serializePrismaValues({
        gia: 2500000n,
        phong: { dienTich: new Prisma.Decimal('20.50') },
        items: [new Prisma.Decimal('1.25'), 10n],
      }),
    ).toEqual({
      gia: '2500000',
      phong: { dienTich: '20.5' },
      items: ['1.25', '10'],
    });
  });

  it('preserves dates, nulls and ordinary values', () => {
    const date = new Date('2026-08-12T00:00:00.000Z');
    expect(serializePrismaValues({ date, value: null, active: true })).toEqual({
      date,
      value: null,
      active: true,
    });
  });
});

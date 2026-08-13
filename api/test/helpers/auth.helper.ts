/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

interface ApiData<T> {
  success: true;
  data: T;
}
interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function registerAndLogin(
  app: INestApplication,
  input: {
    hoTen: string;
    email: string;
    matKhau: string;
    soDienThoai?: string;
  },
): Promise<Tokens> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send(input)
    .expect(201);
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: input.email, matKhau: input.matKhau })
    .expect(200);
  return (response.body as ApiData<Tokens>).data;
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { TaiKhoanService } from '../tai-khoan/tai-khoan.service';
import { AuthService } from './auth.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

interface SessionCreateArgs {
  data: { diaChiIp?: string; userAgent?: string };
}

describe('AuthService', () => {
  let loginCreate: SessionCreateArgs | undefined;
  const account = {
    id: '71b39d2b-34ab-4fb0-8010-4ffde561479e',
    email: 'user@example.com',
    matKhauHash: 'hash',
    trangThai: 'HOAT_DONG',
  };
  const accounts = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
  };
  const passwords = { hash: jest.fn(), verify: jest.fn() };
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const config = {
    getOrThrow: jest.fn(
      (key: string) =>
        ({
          JWT_ACCESS_SECRET: 'a'.repeat(32),
          JWT_REFRESH_SECRET: 'b'.repeat(32),
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '30d',
        })[key],
    ),
  };
  const prisma = {
    phienDangNhap: {
      create: jest.fn((args: SessionCreateArgs) => {
        loginCreate = args;
      }),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    loginCreate = undefined;
    service = new AuthService(
      prisma as unknown as PrismaService,
      accounts as unknown as TaiKhoanService,
      passwords,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('logs in with valid credentials and creates a hashed refresh session', async () => {
    accounts.findByEmail.mockResolvedValue(account);
    passwords.verify.mockResolvedValue(true);
    passwords.hash.mockResolvedValue('refresh-hash');
    jwt.signAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh');
    await expect(
      service.login(
        { email: account.email, matKhau: 'StrongPassword123' },
        { diaChiIp: '127.0.0.1', userAgent: 'test-agent' },
      ),
    ).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(passwords.hash).toHaveBeenCalledWith('refresh');
    expect(prisma.phienDangNhap.create).toHaveBeenCalledTimes(1);
    expect(loginCreate?.data.diaChiIp).toBe('127.0.0.1');
    expect(loginCreate?.data.userAgent).toBe('test-agent');
  });

  it('uses a generic error for a wrong password', async () => {
    accounts.findByEmail.mockResolvedValue(account);
    passwords.verify.mockResolvedValue(false);
    await expect(
      service.login({ email: account.email, matKhau: 'wrong' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects duplicate registration', async () => {
    accounts.findByEmail.mockResolvedValue(account);
    await expect(
      service.register({
        hoTen: 'User',
        email: account.email,
        matKhau: 'StrongPassword123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a clear conflict for a duplicate phone', async () => {
    accounts.findByEmail.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('hash');
    accounts.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );
    await expect(
      service.register({
        hoTen: 'User',
        email: 'new@example.com',
        soDienThoai: '0901234567',
        matKhau: 'StrongPassword123',
      }),
    ).rejects.toThrow('Số điện thoại đã được sử dụng');
  });

  it('returns a clear conflict when an email races during creation', async () => {
    accounts.findByEmail.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('hash');
    accounts.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
        meta: { target: ['email'] },
      }),
    );
    await expect(
      service.register({
        hoTen: 'User',
        email: 'used@example.com',
        matKhau: 'StrongPassword123',
      }),
    ).rejects.toThrow('Email đã được sử dụng');
  });

  it('rotates a valid refresh token and revokes the previous session atomically', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: account.id,
      email: account.email,
      sessionId: 'old',
    });
    prisma.phienDangNhap.findUnique.mockResolvedValue({
      id: 'old',
      taiKhoanId: account.id,
      refreshTokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: null,
      taiKhoan: account,
    });
    passwords.verify.mockResolvedValue(true);
    passwords.hash.mockResolvedValue('new-hash');
    jwt.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');
    let refreshCreate: SessionCreateArgs | undefined;
    const tx = {
      phienDangNhap: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn((args: SessionCreateArgs) => {
          refreshCreate = args;
        }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
    );
    await expect(
      service.refresh('old-refresh-token-value', {
        diaChiIp: '127.0.0.2',
        userAgent: 'refresh-agent',
      }),
    ).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(tx.phienDangNhap.updateMany).toHaveBeenCalled();
    expect(tx.phienDangNhap.create).toHaveBeenCalledTimes(1);
    expect(refreshCreate?.data.diaChiIp).toBe('127.0.0.2');
    expect(refreshCreate?.data.userAgent).toBe('refresh-agent');
  });
});

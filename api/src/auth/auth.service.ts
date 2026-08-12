import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { TaiKhoanService } from '../tai-khoan/tai-khoan.service';
import type { DangKyDto } from './dto/dang-ky.dto';
import type { DangNhapDto } from './dto/dang-nhap.dto';
import type { JwtPayload, RequestMetadata, TokenPair } from './auth.types';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: TaiKhoanService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: DangKyDto) {
    if (await this.accounts.findByEmail(dto.email))
      throw new ConflictException('Email đã được sử dụng');
    const matKhauHash = await this.passwords.hash(dto.matKhau);
    return this.accounts.create({
      hoTen: dto.hoTen,
      email: dto.email,
      ...(dto.soDienThoai ? { soDienThoai: dto.soDienThoai } : {}),
      matKhauHash,
    });
  }

  async login(dto: DangNhapDto, metadata: RequestMetadata): Promise<TokenPair> {
    const account = await this.accounts.findByEmail(dto.email);
    if (
      !account ||
      account.trangThai !== 'HOAT_DONG' ||
      !(await this.passwords.verify(account.matKhauHash, dto.matKhau))
    )
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    await this.accounts.updateLastLogin(account.id);
    return this.createSession(account.id, account.email, metadata);
  }

  async refresh(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<TokenPair> {
    const payload = await this.verifyRefresh(refreshToken);
    const session = await this.prisma.phienDangNhap.findUnique({
      where: { id: payload.sessionId },
      include: { taiKhoan: true },
    });
    if (
      !session ||
      session.taiKhoanId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await this.passwords.verify(session.refreshTokenHash, refreshToken))
    )
      throw new UnauthorizedException('Refresh token không hợp lệ');

    const nextId = randomUUID();
    const tokens = await this.signTokens({
      sub: session.taiKhoan.id,
      email: session.taiKhoan.email,
      sessionId: nextId,
    });
    const refreshTokenHash = await this.passwords.hash(tokens.refreshToken);
    await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.phienDangNhap.updateMany({
        where: { id: session.id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
          replacedBySessionId: nextId,
        },
      });
      if (revoked.count !== 1)
        throw new UnauthorizedException('Refresh token đã được sử dụng');
      await tx.phienDangNhap.create({
        data: {
          id: nextId,
          taiKhoanId: session.taiKhoanId,
          refreshTokenHash,
          expiresAt: this.refreshExpiry(),
          diaChiIp: metadata.diaChiIp,
          userAgent: metadata.userAgent,
        },
      });
    });
    return tokens;
  }

  async logout(user: JwtPayload): Promise<{ loggedOut: true }> {
    await this.prisma.phienDangNhap.updateMany({
      where: { id: user.sessionId, taiKhoanId: user.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }

  private async createSession(
    accountId: string,
    email: string,
    metadata: RequestMetadata,
  ): Promise<TokenPair> {
    const sessionId = randomUUID();
    const tokens = await this.signTokens({ sub: accountId, email, sessionId });
    await this.prisma.phienDangNhap.create({
      data: {
        id: sessionId,
        taiKhoanId: accountId,
        refreshTokenHash: await this.passwords.hash(tokens.refreshToken),
        expiresAt: this.refreshExpiry(),
        diaChiIp: metadata.diaChiIp,
        userAgent: metadata.userAgent,
      },
    });
    return tokens;
  }

  private async signTokens(payload: JwtPayload): Promise<TokenPair> {
    const accessExpires = this.config.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) as SignOptions['expiresIn'];
    const refreshExpires = this.config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as SignOptions['expiresIn'];
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpires,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpires,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private verifyRefresh(token: string): Promise<JwtPayload> {
    return this.jwt
      .verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      });
  }
  private refreshExpiry(): Date {
    return new Date(
      Date.now() +
        this.durationMs(
          this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
        ),
    );
  }
  private durationMs(value: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) throw new Error('Invalid token duration');
    return Number(match[1]) * units[match[2]];
  }
}

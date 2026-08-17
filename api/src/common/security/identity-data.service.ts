import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

@Injectable()
export class IdentityDataService {
  constructor(private readonly config: ConfigService) {}
  normalize(value: string) {
    return value.trim().toUpperCase();
  }
  protect(value: string) {
    const key = this.key();
    const normalized = this.normalize(value);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(normalized, 'utf8'),
      cipher.final(),
    ]);
    return {
      soGiayToMaHoa: `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`,
      soGiayToHash: createHmac('sha256', key).update(normalized).digest('hex'),
    };
  }
  decrypt(value: string) {
    try {
      const [version, iv, tag, encrypted, ...extra] = value.split('.');
      if (version !== 'v1' || !iv || !tag || !encrypted || extra.length)
        throw new Error('format');
      if (![iv, tag, encrypted].every((part) => /^[A-Za-z0-9_-]+$/.test(part)))
        throw new Error('base64url');
      if (
        Buffer.from(iv, 'base64url').length !== 12 ||
        Buffer.from(tag, 'base64url').length !== 16
      )
        throw new Error('component length');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key(),
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Không thể giải mã dữ liệu giấy tờ',
      );
    }
  }
  private key() {
    const encoded = this.config.get<string>('IDENTITY_DATA_KEY');
    const key = encoded ? Buffer.from(encoded, 'base64') : Buffer.alloc(0);
    if (key.length !== 32)
      throw new ServiceUnavailableException(
        'Khóa mã hóa dữ liệu giấy tờ không hợp lệ',
      );
    return key;
  }
}

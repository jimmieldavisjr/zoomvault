import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AppConfig } from '../../config/configuration';

/**
 * Minimal admin auth for the MVP: a single shared access code.
 *
 * The code is accepted from either the `x-admin-access-code` header or an
 * `Authorization: Bearer <code>` header. This is intentionally simple — full
 * user accounts are explicitly out of scope for the first MVP.
 */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  private readonly logger = new Logger(AdminAccessGuard.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('adminAccessCode', { infer: true });

    // Fail closed: if no code is configured, no one gets in.
    if (!expected) {
      this.logger.error(
        'ADMIN_ACCESS_CODE is not set; denying all admin requests.',
      );
      throw new UnauthorizedException('Admin access is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = this.extractCode(request);

    if (!provided || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid admin access code.');
    }
    return true;
  }

  private extractCode(request: Request): string | undefined {
    const header = request.header('x-admin-access-code');
    if (header) return header;

    const auth = request.header('authorization');
    if (auth?.toLowerCase().startsWith('bearer ')) {
      return auth.slice(7).trim();
    }
    return undefined;
  }

  /** Constant-time comparison to avoid leaking the code via timing. */
  private safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}

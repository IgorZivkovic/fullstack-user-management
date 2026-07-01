import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { AuthUsersService } from './auth-users.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import type { AccessTokenPayload, RefreshTokenPayload } from './auth.types';

type RefreshTokenOptions = {
  ignoreExpiration?: boolean;
};

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];
  private readonly isProduction: boolean;
  private readonly refreshCookiePath: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authUsers: AuthUsersService,
  ) {
    this.accessSecret = this.config.get('JWT_ACCESS_SECRET', 'change-me-access');
    this.refreshSecret = this.config.get('JWT_REFRESH_SECRET', 'change-me-refresh');
    this.accessExpiresIn = this.config.get(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as JwtSignOptions['expiresIn'];
    this.refreshExpiresIn = this.config.get(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as JwtSignOptions['expiresIn'];
    this.isProduction = this.config.get('NODE_ENV') === 'production';
    this.refreshCookiePath = this.buildRefreshCookiePath();
  }

  async validateUser(email: string, password: string) {
    if (!email || !password) {
      return null;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.authUsers.findByEmail(normalizedEmail);
    if (!user) {
      return null;
    }
    let matches = false;
    try {
      matches = await argon2.verify(user.passwordHash, password);
    } catch {
      return null;
    }
    if (!matches) {
      return null;
    }
    return user;
  }

  issueAccessToken(user: { id: number; email: string; role: string }) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as AccessTokenPayload['role'],
    };
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  issueRefreshToken(user: { id: number; email: string; role: string; tokenVersion: number }) {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as RefreshTokenPayload['role'],
      tokenVersion: user.tokenVersion ?? 0,
    };
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  verifyRefreshToken(token: string, options: RefreshTokenOptions = {}) {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
        ignoreExpiration: options.ignoreExpiration ?? false,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = this.authUsers.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { user, payload };
  }

  getRefreshTokenFromRequest(request: Request) {
    return request.cookies?.[REFRESH_COOKIE_NAME];
  }

  setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getRefreshCookieOptions());
  }

  clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
  }

  private getRefreshCookieOptions() {
    const maxAge = this.parseDurationToMs(this.refreshExpiresIn);
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isProduction,
      path: this.refreshCookiePath,
      ...(maxAge ? { maxAge } : {}),
    };
  }

  private buildRefreshCookiePath() {
    const prefix = this.normalizePathSegment(this.config.get('API_PREFIX', 'api'));
    const version = this.normalizePathSegment(this.config.get('API_VERSION', 'v1'));

    return `/${[prefix, version, 'auth'].filter(Boolean).join('/')}`;
  }

  private normalizePathSegment(value: string) {
    return value.replace(/^\/+|\/+$/g, '');
  }

  private parseDurationToMs(value: JwtSignOptions['expiresIn']) {
    if (typeof value === 'number') {
      return value * 1000;
    }
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    const match = /^(\d+)([smhd])$/.exec(trimmed);
    if (!match) {
      return undefined;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return amount * multipliers[unit];
  }
}

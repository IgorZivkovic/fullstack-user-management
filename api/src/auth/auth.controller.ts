import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthUsersService } from './auth-users.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthService } from './auth.service';
import {
  AccessTokenResponseDto,
  AuthUserResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly webOrigin: string;

  constructor(
    private readonly authService: AuthService,
    private readonly authUsers: AuthUsersService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly config: ConfigService,
  ) {
    this.webOrigin = this.normalizeOrigin(this.config.get('WEB_ORIGIN', 'http://localhost:4200'));
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  login(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: LoginDto,
  ) {
    void body;
    const user = request.user as { id: number; email: string; role: string; tokenVersion: number };
    const accessToken = this.authService.issueAccessToken(user);
    const refreshToken = this.authService.issueRefreshToken(user);
    this.authService.setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.ensureSameOrigin(request);
    this.rateLimit.assertWithinLimit(`refresh:${this.getClientId(request)}`);
    const refreshToken = this.authService.getRefreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const { user } = this.authService.verifyRefreshToken(refreshToken);
    const accessToken = this.authService.issueAccessToken(user);
    const nextRefreshToken = this.authService.issueRefreshToken(user);
    this.authService.setRefreshCookie(response, nextRefreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.ensureSameOrigin(request);
    const refreshToken = this.authService.getRefreshTokenFromRequest(request);
    if (refreshToken) {
      try {
        const { payload } = this.authService.verifyRefreshToken(refreshToken, {
          ignoreExpiration: true,
        });
        this.authUsers.incrementTokenVersion(payload.sub);
      } catch {
        // Ignore invalid refresh tokens on logout.
      }
    }
    this.authService.clearRefreshCookie(response);
    return { loggedOut: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthUserResponseDto })
  me(@Req() request: Request) {
    const user = request.user as { id: number; email: string; role: string } | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private ensureSameOrigin(request: Request) {
    const origin = this.getRequestOrigin(request);
    if (!origin) {
      throw new ForbiddenException('Missing origin');
    }
    if (origin !== this.webOrigin) {
      throw new ForbiddenException('Invalid origin');
    }
  }

  private getRequestOrigin(request: Request) {
    const originHeader = request.headers.origin;
    if (originHeader) {
      return this.normalizeOrigin(originHeader);
    }
    const refererHeader = request.headers.referer;
    if (!refererHeader) {
      return null;
    }
    return this.normalizeOrigin(refererHeader);
  }

  private normalizeOrigin(value: string) {
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  }

  private getClientId(request: Request) {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      return forwarded.split(',')[0]?.trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }
}

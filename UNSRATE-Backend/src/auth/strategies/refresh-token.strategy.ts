import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('REFRESH_TOKEN_SECRET') ||
        'your-refresh-token-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // Get the token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Refresh token is required in Authorization header',
      );
    }

    const refreshToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    return { userId: payload.sub, nim: payload.nim, refreshToken };
  }
}

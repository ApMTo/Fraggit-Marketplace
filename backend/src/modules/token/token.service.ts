import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UserPayload } from '../auth/dto/user-payload.dto';

type RefreshPayload = UserPayload & { jti: string };

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: UserPayload) {
    const refreshTokenId = randomUUID();
    const accessSecret = this.configService.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret = this.configService.getOrThrow<string>(
      'jwt.refreshSecret',
    );

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '20m',
      secret: accessSecret,
    });

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: refreshTokenId },
      {
        expiresIn: '14d',
        secret: refreshSecret,
      },
    );

    return { accessToken, refreshToken, refreshTokenId };
  }

  async verifyRefreshToken(refreshToken: string): Promise<RefreshPayload> {
    return this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });
  }
}

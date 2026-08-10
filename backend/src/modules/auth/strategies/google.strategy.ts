import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import { GoogleOAuthStateStore } from '../utils/google-oauth-state.store';

export type GoogleAuthProfile = {
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService, stateStore: GoogleOAuthStateStore) {
    const clientID = configService.get<string>('google.clientId') ?? '';
    const clientSecret = configService.get<string>('google.clientSecret') ?? '';
    const callbackURL = configService.get<string>('google.callbackUrl') ?? '';

    super({
      clientID: clientID || 'unimplemented',
      clientSecret: clientSecret || 'unimplemented',
      callbackURL:
        callbackURL || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
      // passport-oauth2@1.8+: custom state store must be `store`, not `state`.
      // `state: <object>` is treated as truthy and falls back to express-session.
      store: stateStore,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    if (!email || !profile.id) {
      done(new UnauthorizedException({ code: 'errors.google_auth_failed' }));
      return;
    }

    const payload: GoogleAuthProfile = {
      providerId: profile.id,
      email,
      displayName: (
        profile.displayName ||
        email.split('@')[0] ||
        'User'
      ).trim(),
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, payload);
  }
}

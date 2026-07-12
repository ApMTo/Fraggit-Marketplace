import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { type AppLocale, parseAcceptLanguageHeader } from '../i18n/locale';

export const ACCEPT_LANGUAGE_HEADER = 'accept-language';

export const RequestLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppLocale => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return parseAcceptLanguageHeader(request.headers[ACCEPT_LANGUAGE_HEADER]);
  },
);

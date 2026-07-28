import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

export type AccountRestrictionPayload = {
  status: typeof UserStatus.BANNED | typeof UserStatus.SUSPENDED;
  publicMessage: string | null;
  caseId: string | null;
  suspendedUntil: string | null;
};

type RestrictedUser = {
  status: UserStatus;
  statusPublicMessage: string | null;
  statusCaseId: string | null;
  suspendedUntil: Date | null;
};

export function buildAccountRestriction(
  user: RestrictedUser,
): AccountRestrictionPayload {
  return {
    status: user.status as AccountRestrictionPayload['status'],
    publicMessage: user.statusPublicMessage,
    caseId: user.statusCaseId,
    suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
  };
}

export function throwIfAccountRestricted(user: RestrictedUser): void {
  if (
    user.status !== UserStatus.BANNED &&
    user.status !== UserStatus.SUSPENDED
  ) {
    return;
  }

  const code =
    user.status === UserStatus.BANNED
      ? 'errors.account_blocked'
      : 'errors.account_deactivated';

  throw new UnauthorizedException({
    code,
    restriction: buildAccountRestriction(user),
  });
}

export function formatStatusCaseId(actionId: string): string {
  return `CASE-${actionId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

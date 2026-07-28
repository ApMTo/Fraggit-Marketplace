import { EmailTemplates } from '../../mail/utils/email-templates';

/**
 * @deprecated Prefer EmailTemplates from the mail module.
 * Kept as a thin wrapper for existing auth/user call sites.
 */
export class EmailRenderer {
  static renderInvitationEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    return EmailTemplates.renderInvitationEmail(
      displayName,
      token,
      frontendUrl,
    );
  }

  static renderPasswordResetEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    return EmailTemplates.renderPasswordResetEmail(
      displayName,
      token,
      frontendUrl,
    );
  }

  static renderEmailChangeCodeEmail(
    displayName: string,
    code: string,
    newEmail: string,
    frontendUrl: string,
  ): string {
    return EmailTemplates.renderEmailChangeCodeEmail(
      displayName,
      code,
      newEmail,
      frontendUrl,
    );
  }
}

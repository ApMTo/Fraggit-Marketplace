export class EmailRenderer {
  static renderInvitationEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    const verifyUrl = `${frontendUrl}/auth/verify/${token}`;
    return `
      <h2>Welcome to Fraggit, ${displayName}!</h2>
      <p>Please verify your email to activate your account.</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
    `;
  }

  static renderPasswordResetEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    const resetUrl = `${frontendUrl}/auth/reset-password/${token}`;
    return `
      <h2>Password reset</h2>
      <p>Hi ${displayName},</p>
      <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
    `;
  }

  static renderEmailChangeCodeEmail(
    displayName: string,
    code: string,
    newEmail: string,
  ): string {
    return `
      <h2>Confirm email change</h2>
      <p>Hi ${displayName},</p>
      <p>You requested to change your Fraggit email to <strong>${newEmail}</strong>.</p>
      <p>Your confirmation code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 15 minutes. If you did not request this change, ignore this email.</p>
    `;
  }
}

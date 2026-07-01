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
}

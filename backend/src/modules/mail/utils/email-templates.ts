import { escapeHtml, renderCodeBlock, renderEmailLayout } from './email-layout';

export class EmailTemplates {
  static renderInvitationEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/auth/verify/${token}`;
    const name = escapeHtml(displayName);

    return renderEmailLayout({
      frontendUrl,
      preheader: 'Verify your email to activate your Fraggit account',
      heading: `Welcome to Fraggit, ${displayName}!`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0;">Please verify your email to activate your account and start trading on Fraggit.</p>
      `,
      cta: { label: 'Verify email', url: verifyUrl },
      footerNote:
        'This link expires soon. If you did not create an account, you can ignore this email.',
    });
  }

  static renderPasswordResetEmail(
    displayName: string,
    token: string,
    frontendUrl: string,
  ): string {
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password/${token}`;
    const name = escapeHtml(displayName);

    return renderEmailLayout({
      frontendUrl,
      preheader: 'Reset your Fraggit password — link expires in 15 minutes',
      heading: 'Reset your password',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0;">We received a request to reset your Fraggit password. Click the button below to choose a new one. This link expires in 15 minutes.</p>
      `,
      cta: { label: 'Reset password', url: resetUrl },
      footerNote:
        'If you did not request a password reset, you can safely ignore this email.',
    });
  }

  static renderEmailChangeCodeEmail(
    displayName: string,
    code: string,
    newEmail: string,
    frontendUrl: string,
  ): string {
    const name = escapeHtml(displayName);
    const email = escapeHtml(newEmail);

    return renderEmailLayout({
      frontendUrl,
      preheader: `Your Fraggit email change code is ${code}`,
      heading: 'Confirm email change',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 12px;">You requested to change your Fraggit email to <strong style="color:#f4f4f7;">${email}</strong>.</p>
        <p style="margin:0;">Your confirmation code:</p>
        ${renderCodeBlock(code)}
        <p style="margin:0;">This code expires in 15 minutes.</p>
      `,
      footerNote:
        'If you did not request this change, ignore this email and keep using your current address.',
    });
  }

  static renderTwoFactorCodeEmail(
    displayName: string,
    code: string,
    frontendUrl: string,
    purpose: 'login' | 'enable',
  ): string {
    const name = escapeHtml(displayName);
    const heading =
      purpose === 'login'
        ? 'Your login code'
        : 'Enable two-factor authentication';
    const intro =
      purpose === 'login'
        ? 'Use this code to finish signing in to Fraggit.'
        : 'Use this code to enable two-factor authentication on your Fraggit account.';

    return renderEmailLayout({
      frontendUrl,
      preheader: `Your Fraggit code is ${code}`,
      heading,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 12px;">${intro}</p>
        <p style="margin:0;">Your 6-digit code:</p>
        ${renderCodeBlock(code)}
        <p style="margin:0;">This code expires in 15 minutes.</p>
      `,
      footerNote:
        'If you did not try to sign in or change security settings, ignore this email.',
    });
  }

  static renderChatNotificationEmail(data: {
    frontendUrl: string;
    senderDisplayName: string;
    conversationId: string;
    messagePreview: string;
  }): string {
    const chatUrl = `${data.frontendUrl.replace(/\/$/, '')}/chat/${data.conversationId}`;
    const sender = escapeHtml(data.senderDisplayName);
    const preview = escapeHtml(data.messagePreview || 'New message');

    return renderEmailLayout({
      frontendUrl: data.frontendUrl,
      preheader: `New message from ${data.senderDisplayName}`,
      heading: 'New message',
      bodyHtml: `
        <p style="margin:0 0 12px;"><strong style="color:#f4f4f7;">${sender}</strong> sent you a message:</p>
        <p style="margin:0;padding:14px 16px;border-radius:10px;background-color:#16171f;border:1px solid #2e3040;color:#f4f4f7;">${preview}</p>
      `,
      cta: { label: 'Open chat', url: chatUrl },
    });
  }

  static renderOrderNotificationEmail(data: {
    frontendUrl: string;
    title: string;
    body: string;
    href: string;
  }): string {
    const body = escapeHtml(data.body);

    return renderEmailLayout({
      frontendUrl: data.frontendUrl,
      preheader: data.title,
      heading: data.title,
      bodyHtml: `
        <p style="margin:0;">${body || 'Open Fraggit for details.'}</p>
      `,
      cta: { label: 'Open', url: data.href },
    });
  }
}

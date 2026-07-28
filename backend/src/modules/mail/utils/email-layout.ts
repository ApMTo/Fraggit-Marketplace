/**
 * Shared Fraggit-branded HTML email shell.
 * Table + inline CSS for broad client support.
 */

const BRAND = {
  bg: '#16171f',
  surface: '#1e1f2b',
  border: '#2e3040',
  text: '#f4f4f7',
  muted: '#9a9cb0',
  subtle: '#6e7085',
  blue: '#5B7CFA',
  purple: '#9B5BF0',
  white: '#ffffff',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type EmailCta = {
  label: string;
  url: string;
};

type EmailLayoutOptions = {
  frontendUrl: string;
  preheader?: string;
  heading: string;
  bodyHtml: string;
  cta?: EmailCta;
  footerNote?: string;
};

function renderCtaButton(cta: EmailCta): string {
  const url = escapeHtml(cta.url);
  const label = escapeHtml(cta.label);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
      <tr>
        <td align="center" bgcolor="${BRAND.blue}" style="border-radius:10px;background:linear-gradient(120deg,${BRAND.blue} 0%,${BRAND.purple} 100%);">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:1.2;color:${BRAND.white};text-decoration:none;border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const frontendUrl = options.frontendUrl.replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/logo.svg`;
  const preheader = options.preheader
    ? escapeHtml(options.preheader)
    : escapeHtml(options.heading);
  const heading = escapeHtml(options.heading);
  const footerNote = options.footerNote
    ? `<p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.subtle};">${escapeHtml(options.footerNote)}</p>`
    : '';

  const ctaBlock = options.cta ? renderCtaButton(options.cta) : '';
  const fallbackLink = options.cta
    ? `<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.subtle};word-break:break-all;">
        If the button doesn't work, copy this link:<br/>
        <a href="${escapeHtml(options.cta.url)}" style="color:${BRAND.blue};text-decoration:underline;">${escapeHtml(options.cta.url)}</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="supported-color-schemes" content="dark"/>
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <a href="${escapeHtml(frontendUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img src="${escapeHtml(logoUrl)}" alt="Fraggit" width="125" height="30" style="display:block;border:0;outline:none;height:30px;width:125px;"/>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.3;color:${BRAND.text};letter-spacing:-0.02em;">
                ${heading}
              </h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.muted};">
                ${options.bodyHtml}
              </div>
              ${ctaBlock}
              ${fallbackLink}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0;">
              ${footerNote}
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.subtle};">
                © Fraggit · <a href="${escapeHtml(frontendUrl)}" style="color:${BRAND.subtle};text-decoration:underline;">${escapeHtml(frontendUrl.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderCodeBlock(code: string): string {
  return `<p style="margin:20px 0;text-align:center;">
    <span style="display:inline-block;padding:14px 22px;border-radius:10px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:6px;color:${BRAND.text};">
      ${escapeHtml(code)}
    </span>
  </p>`;
}

export { BRAND };

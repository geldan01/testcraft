import type { Transporter } from 'nodemailer'

// ---------------------------------------------------------------------------
// Lazy-initialized SMTP transporter (singleton)
// ---------------------------------------------------------------------------

let _transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!_transporter) {
    const nodemailer = require('nodemailer') as typeof import('nodemailer')
    const config = useRuntimeConfig()

    _transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort as number,
      secure: (config.smtpPort as number) === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  return _transporter
}

// ---------------------------------------------------------------------------
// Invitation email
// ---------------------------------------------------------------------------

export async function sendInvitationEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  role: string,
  inviteUrl: string,
): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.emailEnabled) {
    console.log(`[email] Email disabled — skipping invitation email to ${to}`)
    return
  }

  if (!config.smtpHost) {
    console.warn('[email] EMAIL_ENABLED is true but SMTP_HOST is not set — skipping')
    return
  }

  const formattedRole = role
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0; padding:0; background:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5; padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">You're Invited!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join
                <strong>${organizationName}</strong> as a <strong>${formattedRole}</strong>
                on TestCraft.
              </p>
              <p style="margin:0 0 24px; color:#6b7280; font-size:14px; line-height:1.5;">
                Click the button below to accept the invitation and get started.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block; background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 32px; border-radius:8px; font-size:15px; font-weight:600;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0; color:#9ca3af; font-size:12px; line-height:1.5; text-align:center;">
                This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                Sent by TestCraft
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: config.emailFrom as string,
      to,
      subject: `You've been invited to join ${organizationName} on TestCraft`,
      html,
    })
    console.log(`[email] Invitation email sent to ${to}`)
  } catch (err) {
    console.error(`[email] Failed to send invitation email to ${to}:`, err)
  }
}

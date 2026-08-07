// Branded HTML/text renderer for the Auth.js magic-link sign-in email.
//
// Auth.js's Resend provider ships a bare-bones default template — this replaces
// it with markup that matches the Wayframe brand system (dark navy, cyan/violet
// accents, node/edge motif) used across the marketing site and app shell.
//
// Table-based layout with inline styles throughout, on purpose: email clients
// (Outlook in particular) don't reliably support flexbox, external <style>
// blocks, or CSS background-color on plain <a> tags — so the CTA below uses the
// standard "bulletproof button" pattern (a table cell carries the background,
// the anchor just carries the text) instead of styling the link directly.
//
// Used by the custom `sendVerificationRequest` in lib/auth.ts — not called
// directly anywhere else.

const NAVY = "#0F172A";
const NAVY_OUTER = "#0B1220";
const CYAN = "#22D3EE";
const VIOLET = "#A78BFA";
const BORDER = "#1E293B";
const LINE = "#334155";
const MUTED = "#94A3B8";
const MUTED_DIM = "#64748B";
const MUTED_DIMMER = "#475569";
const BODY_TEXT = "#CBD5E1";

export function renderMagicLinkEmailHtml({ url, host }: { url: string; host: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>Sign in to Wayframe</title>
  </head>
  <body style="margin:0; padding:0; background-color:${NAVY_OUTER}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${NAVY_OUTER};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:${NAVY}; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 32px 40px;">

                <!-- decorative node/edge motif, mirrors the deck's title slide -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px auto;">
                  <tr>
                    <td style="width:8px; height:8px; background-color:${CYAN}; border-radius:50%; font-size:0; line-height:0;">&nbsp;</td>
                    <td style="width:28px; height:1px; background-color:${LINE}; font-size:0; line-height:0;">&nbsp;</td>
                    <td style="width:8px; height:8px; background-color:${VIOLET}; border-radius:50%; font-size:0; line-height:0;">&nbsp;</td>
                    <td style="width:28px; height:1px; background-color:${LINE}; font-size:0; line-height:0;">&nbsp;</td>
                    <td style="width:8px; height:8px; background-color:${CYAN}; border-radius:50%; font-size:0; line-height:0;">&nbsp;</td>
                  </tr>
                </table>

                <p style="margin:0; text-align:center; font-size:26px; font-weight:700; letter-spacing:2px; color:${CYAN};">WAYFRAME</p>
                <p style="margin:8px 0 28px 0; text-align:center; font-size:13px; font-style:italic; color:${MUTED};">Plan the flow before you build the app.</p>

                <p style="margin:0 0 8px 0; text-align:center; font-size:19px; font-weight:600; color:#FFFFFF;">Sign in to your account</p>
                <p style="margin:0 0 32px 0; text-align:center; font-size:14px; line-height:1.6; color:${BODY_TEXT};">
                  Click the button below to sign in. This link expires in 24&nbsp;hours and can only be used once.
                </p>

                <!-- bulletproof CTA button: background lives on the <td>, not the <a> -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td style="border-radius:999px; background-color:${CYAN};">
                      <a href="${url}" target="_blank" style="display:inline-block; padding:14px 36px; font-size:15px; font-weight:700; color:${NAVY}; text-decoration:none; border-radius:999px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                        Sign in to Wayframe
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:32px 0 0 0; text-align:center; font-size:12px; line-height:1.6; color:${MUTED_DIM};">
                  Or paste this link into your browser:<br />
                  <a href="${url}" style="color:${CYAN}; word-break:break-all;">${url}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px; border-top:1px solid ${BORDER};">
                <p style="margin:0; text-align:center; font-size:12px; color:${MUTED_DIM};">
                  If you didn't request this email, you can safely ignore it — no account changes were made.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0 0; text-align:center; font-size:11px; color:${MUTED_DIMMER};">
            Sent from ${host} &middot; Wayframe
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderMagicLinkEmailText({ url, host }: { url: string; host: string }) {
  return [
    "WAYFRAME",
    "Plan the flow before you build the app.",
    "",
    "Sign in to your account",
    `Use the link below — it expires in 24 hours and can only be used once.`,
    "",
    url,
    "",
    "If you didn't request this email, you can safely ignore it — no account changes were made.",
    "",
    `Sent from ${host} · Wayframe`,
  ].join("\n");
}
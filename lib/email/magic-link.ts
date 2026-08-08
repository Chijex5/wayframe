// Branded HTML/text renderer for the Auth.js magic-link sign-in email.
//
// Colors and radius are pulled from the app's own design tokens (globals.css
// :root / [data-theme="light"]) rather than a separate palette, so this stays
// correct if those tokens change — as long as the constants below are kept in
// sync by hand (email can't read CSS custom properties at send time; it's
// rendered server-side with no access to the client stylesheet).
//
// LIGHT-FIRST, on purpose. The previous version was dark-first with a
// `prefers-color-scheme: light` override, which read *inverted* in real inboxes:
// Gmail and Outlook mobile auto-dark-mode assume an email is authored light and
// invert it themselves, so a dark-authored email got flipped at exactly the
// wrong time. Every mail client's baseline expectation is a light email, so the
// inline styles (the only thing Outlook desktop and auto-invert engines ever
// see) now carry the LIGHT look. Clients that genuinely honor
// `prefers-color-scheme: dark` (Apple/iOS Mail, Outlook.com, Yahoo) get the dark
// variant from the <style> override. Gmail's dark mode uses proprietary
// detection and isn't covered here — a known gap, not an oversight — but because
// the base is light, its auto-invert now produces a sensible dark rather than a
// broken light-on-light.
//
// Theme-sensitive colors live on classes (`.email-bg`, `.email-card`,
// `.text-heading`, `.brand`, etc.) and are overridden with `!important` in the
// dark media query — required because inline styles otherwise always beat a
// stylesheet. The wordmark and CTA get their own classes so their accent color
// flips too instead of being clobbered by the heading override.
//
// Table-based layout with inline styles throughout: email clients don't reliably
// support flexbox or CSS background on plain <a> tags, so the CTA uses the
// standard "bulletproof button" pattern (the <td> carries the background, the
// anchor only the text).
//
// Used by the custom `sendVerificationRequest` in auth.ts — not called directly
// anywhere else.

// -- Light (default / inline) — mirrors [data-theme="light"] in globals.css --
const BG = "#f7f8fa";
const SURFACE = "#ffffff";
const BORDER = "#dce0e5";
const TEXT_PRIMARY = "#14181f";
const TEXT_SECONDARY = "#5b6470";
const ACCENT = "#2563eb";

// -- Dark (media-query override) — mirrors :root in globals.css --
const DARK_BG = "#0b0f14";
const DARK_SURFACE = "#131820";
const DARK_BORDER = "#2a323d";
const DARK_TEXT_PRIMARY = "#e4e7eb";
const DARK_TEXT_SECONDARY = "#8b95a1";
const DARK_ACCENT = "#4c8dff";

// IBM Plex Sans is the app's --font-ui; not guaranteed on the recipient's device,
// so it leads a standard system-font fallback stack.
const FONT_STACK =
  "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderMagicLinkEmailHtml({ url, host }: { url: string; host: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Sign in to Wayframe</title>
    <style>
      /* Dark override — mirrors :root in globals.css. Base (inline) is light. */
      @media (prefers-color-scheme: dark) {
        .email-bg { background-color: ${DARK_BG} !important; }
        .email-card { background-color: ${DARK_SURFACE} !important; border-color: ${DARK_BORDER} !important; }
        .panel { background-color: ${DARK_BG} !important; border-color: ${DARK_BORDER} !important; }
        .text-heading { color: ${DARK_TEXT_PRIMARY} !important; }
        .text-body { color: ${DARK_TEXT_SECONDARY} !important; }
        .text-muted { color: ${DARK_TEXT_SECONDARY} !important; }
        .brand { color: ${DARK_ACCENT} !important; }
        .cta { background-color: ${DARK_ACCENT} !important; }
        .link-url { color: ${DARK_ACCENT} !important; }
        .rule { border-color: ${DARK_BORDER} !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:${BG}; font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:${BG};">
      <tr>
        <td align="center" style="padding:56px 16px;">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" class="email-card" style="max-width:440px; width:100%; background-color:${SURFACE}; border:1px solid ${BORDER}; border-radius:4px;">
            <tr>
              <td style="padding:44px 40px;">

                <!-- Wordmark: accent bar + label, mirroring the app header. -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td style="padding-right:8px;">
                      <div class="cta" style="width:3px; height:16px; background-color:${ACCENT};"></div>
                    </td>
                    <td class="brand" style="font-size:16px; font-weight:600; letter-spacing:1.5px; color:${ACCENT}; font-family:${FONT_STACK};">WAYFRAME</td>
                  </tr>
                </table>

                <p class="text-heading" style="margin:32px 0 10px 0; text-align:center; font-size:18px; font-weight:600; color:${TEXT_PRIMARY};">Sign in to your account</p>
                <p class="text-body" style="margin:0 0 32px 0; text-align:center; font-size:14px; line-height:1.6; color:${TEXT_SECONDARY};">
                  Use the button below to finish signing in. This link expires in 24&nbsp;hours and can only be used once.
                </p>

                <!-- bulletproof CTA button: background lives on the <td>, not the <a> -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td class="cta" style="border-radius:3px; background-color:${ACCENT};">
                      <a href="${url}" target="_blank" style="display:inline-block; padding:13px 40px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:3px; font-family:${FONT_STACK};">
                        Sign in
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Fallback URL in a bordered panel, monospace-ish, selectable. -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                  <tr>
                    <td class="panel" style="background-color:${BG}; border:1px solid ${BORDER}; border-radius:3px; padding:12px 14px;">
                      <p class="text-muted" style="margin:0 0 4px 0; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${TEXT_SECONDARY};">Or paste this link</p>
                      <a href="${url}" class="link-url" style="font-size:12px; line-height:1.5; color:${ACCENT}; word-break:break-all; text-decoration:none; font-family:${FONT_STACK};">${url}</a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
          <p class="text-muted" style="margin:24px 0 0 0; text-align:center; font-size:11px; line-height:1.5; color:${TEXT_SECONDARY};">
            Sent to sign in at ${host}. Didn't request this?<br />Ignore this email — no changes were made.
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
    "",
    "Sign in to your account",
    "Use the link below to finish signing in. It expires in 24 hours and can only be used once.",
    "",
    url,
    "",
    `Sent to sign in at ${host}. Didn't request this? Ignore this email — no changes were made.`,
  ].join("\n");
}

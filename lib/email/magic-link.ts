// Branded HTML/text renderer for the Auth.js magic-link sign-in email.
//
// Colors and radius are pulled directly from the app's own design tokens
// (globals.css :root / [data-theme="light"]) rather than a separate palette —
// so this stays correct automatically if those tokens change, as long as the
// constants below are kept in sync with globals.css by hand (email can't read
// CSS custom properties at send time, since it's rendered server-side with no
// access to the client stylesheet).
//
// Note the radius: the app's --radius-sm and --radius-md are both 2px — a
// deliberately sharp, technical look, not a rounded/pill aesthetic. The button
// below uses a small 3px radius to match that intent rather than defaulting to
// the rounded style common in marketing emails.
//
// Theme-sensitive: every color that needs to flip between dark and light is on
// a class (`.email-bg`, `.email-card`, `.text-heading`, etc.), overridden in the
// <style> block's `prefers-color-scheme: light` query with `!important` — that's
// required because inline styles otherwise always win over a stylesheet. Inline
// styles carry the dark-mode look as the default/fallback, since Outlook ignores
// <style> blocks entirely and only ever sees the inline values. Clients that DO
// honor prefers-color-scheme (Apple/iOS Mail, Outlook.com, Yahoo) get the light
// variant automatically; Gmail's dark mode uses its own proprietary detection
// and isn't covered here — a known gap, not an oversight.
//
// Table-based layout with inline styles throughout, on purpose: email clients
// don't reliably support flexbox or CSS background-color on plain <a> tags — the
// CTA below uses the standard "bulletproof button" pattern (the <td> carries the
// background, the anchor just carries the text) instead of styling the link
// directly.
//
// Used by the custom `sendVerificationRequest` in lib/auth.ts — not called
// directly anywhere else.

// -- Dark (default) — mirrors :root in globals.css --
const BG = "#0b0f14";
const SURFACE = "#131820";
const BORDER = "#2a323d";
const TEXT_PRIMARY = "#e4e7eb";
const TEXT_SECONDARY = "#8b95a1";
const ACCENT = "#4c8dff";

// IBM Plex Sans is the app's --font-ui; not guaranteed to be installed on the
// recipient's device, so it leads a standard system-font fallback stack.
const FONT_STACK =
  "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderMagicLinkEmailHtml({ url, host }: { url: string; host: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>Sign in to Wayframe</title>
    <style>
      /* Mirrors [data-theme="light"] in globals.css */
      @media (prefers-color-scheme: light) {
        .email-bg { background-color: #f7f8fa !important; }
        .email-card { background-color: #ffffff !important; border-color: #dce0e5 !important; }
        .text-heading { color: #14181f !important; }
        .text-body { color: #5b6470 !important; }
        .text-muted { color: #5b6470 !important; }
        .link-url { color: #2563eb !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:${BG}; font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:${BG};">
      <tr>
        <td align="center" style="padding:56px 16px;">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" class="email-card" style="max-width:440px; width:100%; background-color:${SURFACE}; border:1px solid ${BORDER}; border-radius:4px;">
            <tr>
              <td style="padding:56px 40px;">

                <p class="text-heading" style="margin:0; text-align:center; font-size:20px; font-weight:600; letter-spacing:0.5px; color:${ACCENT};">WAYFRAME</p>

                <p class="text-heading" style="margin:40px 0 12px 0; text-align:center; font-size:17px; font-weight:600; color:${TEXT_PRIMARY};">Sign in to your account</p>
                <p class="text-body" style="margin:0 0 40px 0; text-align:center; font-size:14px; line-height:1.6; color:${TEXT_SECONDARY};">
                  This link expires in 24&nbsp;hours and can only be used once.
                </p>

                <!-- bulletproof CTA button: background lives on the <td>, not the <a> -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td style="border-radius:3px; background-color:${ACCENT};">
                      <a href="${url}" target="_blank" style="display:inline-block; padding:12px 36px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:3px; font-family:${FONT_STACK};">
                        Sign in
                      </a>
                    </td>
                  </tr>
                </table>

                <p class="text-muted" style="margin:40px 0 0 0; text-align:center; font-size:12px; color:${TEXT_SECONDARY};">
                  Trouble with the button? <a href="${url}" class="link-url" style="color:${ACCENT};">Use this link</a> instead.
                </p>
              </td>
            </tr>
          </table>
          <p class="text-muted" style="margin:24px 0 0 0; text-align:center; font-size:11px; color:${TEXT_SECONDARY};">
            Didn't request this? Ignore this email — no changes were made.
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
    "This link expires in 24 hours and can only be used once.",
    "",
    url,
    "",
    "Didn't request this? Ignore this email — no changes were made.",
  ].join("\n");
}

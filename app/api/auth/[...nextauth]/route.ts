// Auth.js REST endpoints (sign-in, callback, session, csrf, sign-out).
// The magic link emailed by Resend points at /api/auth/callback/resend here.
// `handlers` is NextAuth's { GET, POST } pair; re-export both as route handlers.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

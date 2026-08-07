// Module augmentation: expose the user's database id on the session.
//
// Auth.js's default session `user` carries only name/email/image. The Drizzle
// adapter uses the database session strategy, so the `session` callback in auth.ts
// can read the persisted user and copy its id onto `session.user.id`. Declaring it
// here keeps that assignment — and every server-side `auth()` read — type-safe.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

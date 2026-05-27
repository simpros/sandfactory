// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Db } from "@sandfactory/db";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Db["db"];
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
      } | null;
      user: {
        id: string;
        email: string;
        name: string;
      } | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

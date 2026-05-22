// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Db } from "@sandfactory/db";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Db["db"];
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

import { readSetupStatus } from "$lib/server/setup";
import { getSingleUserEmail } from "@sandfactory/auth";
import { redirect } from "@sveltejs/kit";

export function load({ locals }) {
  if (!readSetupStatus(locals.db).setupComplete) {
    throw redirect(307, "/setup");
  }

  if (locals.session !== null) {
    throw redirect(307, "/");
  }

  return {
    email: getSingleUserEmail(),
  };
}

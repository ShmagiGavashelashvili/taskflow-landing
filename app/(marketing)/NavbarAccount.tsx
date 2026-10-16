import { Suspense } from "react";
import { AccountLinks } from "@/components/Navbar";
import { getOptionalAppSession } from "@/server/auth/app-session";

/**
 * The navbar's account links. The session read sits behind Suspense so the landing page stays
 * in the static shell: visitors get the logged-out links straight away, and a signed-in user's
 * "Go to app" streams in.
 */
export default function NavbarAccount() {
  return (
    <Suspense fallback={<AccountLinks signedIn={false} />}>
      <SessionAccountLinks />
    </Suspense>
  );
}

async function SessionAccountLinks() {
  const session = await getOptionalAppSession();
  return <AccountLinks signedIn={session !== null} />;
}

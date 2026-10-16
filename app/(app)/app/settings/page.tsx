import { redirect } from "next/navigation";
import { SETTINGS_NAV } from "./nav";

export default function SettingsIndexPage() {
  redirect(SETTINGS_NAV[0].href);
}

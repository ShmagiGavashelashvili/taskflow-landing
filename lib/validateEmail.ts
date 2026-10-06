import { EMAIL_PATTERN } from "@/constants/forms";

/** Returns an error message for an invalid email, or null when the value is valid. */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (email === "") return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "That doesn't look like a valid email address.";
  return null;
}

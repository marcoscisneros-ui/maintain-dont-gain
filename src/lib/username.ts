// Members log in with "first.lastname" + a 4-digit PIN.
// Under the hood Supabase Auth needs an email + password, so we derive both.
// No email is ever sent — these addresses are never contacted.

const EMAIL_DOMAIN = "members.mdg-challenge.example.com";

/** "José" -> "jose", "O'Brien" -> "obrien" */
export function namePart(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** Whatever someone types in the login box -> canonical username. */
export function normalizeUsername(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export function usernameToEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

export function pinToPassword(pin: string): string {
  // Supabase requires >= 6 characters; PINs are 4 digits.
  return `mdg-${pin}-pin`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

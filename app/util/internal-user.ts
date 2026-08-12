export function isInternalUser(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@hupo.co');
}

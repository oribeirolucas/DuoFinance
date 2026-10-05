/**
 * Simple deterministic password hash function for mock/demo environment.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) + password.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16);
}

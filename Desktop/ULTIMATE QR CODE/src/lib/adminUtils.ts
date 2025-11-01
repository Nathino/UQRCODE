/**
 * Admin utilities for checking admin status and accessing admin features
 */

export const ADMIN_EMAIL = 'adminannektech@gmail.com';

/**
 * Check if a user is an admin based on their email
 */
export function isAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get admin email constant
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}


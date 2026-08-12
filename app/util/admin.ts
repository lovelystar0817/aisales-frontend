export const ADMIN_AUTH0 = {
  DOMAIN: import.meta.env.VITE_ADMIN_AUTH0_DOMAIN || import.meta.env.VITE_AUTH0_DOMAIN,
  CLIENT_ID: import.meta.env.VITE_ADMIN_AUTH0_CLIENT_ID || import.meta.env.VITE_AUTH0_CLIENT_ID,
  AUDIENCE: import.meta.env.VITE_ADMIN_AUTH0_AUDIENCE || import.meta.env.VITE_AUTH0_AUDIENCE,
} as const;

export const ADMIN_SCOPES = [
  'openid',
  'profile', 
  'email',
  'admin:read',
  'admin:write',
] as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Environment helper
export function isAdminEnv(): boolean {
  return window.location.pathname.startsWith('/manage');
}
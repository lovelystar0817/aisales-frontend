// Shared authentication types for both app and manage modules

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  company: {
    _id: string;
    name: string;
    trialEndsAt: string | null;
  };
}

export interface AppAuthUser extends AuthUser {
  onboardingTourCompleted: boolean;
  role?: 'admin' | 'user';
}

export interface ManageAuthUser extends AuthUser {
  // Admin-specific properties can be added here
}

export interface AuthSuccessResponse {
  id: string;
  name: string;
  email: string;
  company: {
    _id: string;
    name: string;
    trialEndsAt: string | null;
  };
  picture: string;
}

export interface AppAuthSuccessResponse extends AuthSuccessResponse {
  onboardingTourCompleted: boolean;
  role?: 'admin' | 'user';
}

export interface ManageAuthSuccessResponse extends AuthSuccessResponse {
  // Admin-specific response properties
}

export interface AuthErrorState {
  title: string;
  message: string;
  action?: {
    text: string;
    href: string;
  };
}

// Auth module configuration types
export type AuthModule = 'app' | 'manage';

export interface AuthModuleConfig {
  module: AuthModule;
  basePath: string;
  successEndpoint: string;
  successRedirect: string;
  errorRedirect: string;
  enableNameInput: boolean;
  logoSrc: string;
  // Store reference to prevent cross-module auth conflicts
  authStore: any; // We'll type this more specifically in the hook
}

// Import the stores to reference them in configs
import { useAuthStore } from '~/store/auth';
import { useManageAuthStore } from '~/store/manageAuth';

// Predefined configurations for each module
export const AUTH_MODULE_CONFIGS: Record<AuthModule, AuthModuleConfig> = {
  app: {
    module: 'app',
    basePath: '/auth',
    successEndpoint: '/auth/success',
    successRedirect: '/',
    errorRedirect: '/auth',
    enableNameInput: true,
    logoSrc: '/logos/Hupo_Logotype_Orange(noR).svg',
    authStore: useAuthStore,
  },
  manage: {
    module: 'manage',
    basePath: '/manage/auth',
    successEndpoint: '/manage/auth/success',
    successRedirect: '/manage/dashboard',
    errorRedirect: '/manage/auth',
    enableNameInput: false,
    logoSrc: '/logos/Hupo_Logotype_Orange(noR).svg',
    authStore: useManageAuthStore,
  },
}; 
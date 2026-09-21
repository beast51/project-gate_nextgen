'use client';

import {
  signIn as nextSignIn,
  signOut as nextSignOut,
  useSession as useNextSession,
} from 'next-auth/react';

export type SignInResult = { ok: boolean, error?: string }

export type PhoneCredentials = { phoneNumber: string, password: string }

// Sign in with a phone number and a password, without leaving the page
export const signInWithPhone = async (credentials: PhoneCredentials): Promise<SignInResult> => {
  const result = await nextSignIn('credentials', { ...credentials, redirect: false });

  return { ok: Boolean(result?.ok) && !result?.error, error: result?.error || undefined };
};

export const signOut = (redirectTo = '/') => nextSignOut({ callbackUrl: redirectTo });

export type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated'

export const useSessionStatus = (): SessionStatus => useNextSession().status;

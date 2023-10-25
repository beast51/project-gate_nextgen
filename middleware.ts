import { i18nRouter } from 'next-i18n-router';
import i18nConfig from './app/sharedLayer/config/i18n/i18nConfig';
import { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(request: NextRequest) {
    return i18nRouter(request, i18nConfig);
  },
  {
  pages: {
    signIn: "/"
  },
  
});

export const config = {
  // matcher: '/((?!api|static|.*\\..*|_next).*)',
  matcher: '/((?!api|static|.*\\..*|_next|^/$|^/en$).*)',
};




import { i18nRouter } from 'next-i18n-router';
import i18nConfig from './app/sharedLayer/config/i18n/i18nConfig';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware'

const LOCALE_HEADER = 'x-next-i18n-router-locale';

// next-i18n-router 4 reports the locale of the request in a header of the RESPONSE. Next.js 14 leaked
// such headers into the request, so server components could read it; Next.js 16 does not.
// The locale is handed over properly: as a header of the request that goes on to the page.
const withLocaleForServer = (request: NextRequest, routed: NextResponse) => {
  const locale = routed.headers.get(LOCALE_HEADER);
  const isRedirect = routed.status >= 300 && routed.status < 400;

  if (!locale || isRedirect) return routed;

  // whatever a client sent in this header is overwritten
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);

  const rewrittenTo = routed.headers.get('x-middleware-rewrite');
  const forwarded = rewrittenTo
    ? NextResponse.rewrite(rewrittenTo, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  routed.cookies.getAll().forEach(cookie => forwarded.cookies.set(cookie));
  forwarded.headers.set(LOCALE_HEADER, locale);

  return forwarded;
};

export default withAuth(
  function proxy(request: NextRequest) {
    return withLocaleForServer(request, i18nRouter(request, i18nConfig));
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

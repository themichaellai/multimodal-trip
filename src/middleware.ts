import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

const isAuthPage = createRouteMatcher(['/auth']);

export default convexAuthNextjsMiddleware((req) => {
  if (isAuthPage(req) && isAuthenticatedNextjs()) {
    return nextjsMiddlewareRedirect(req, '/t');
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

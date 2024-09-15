import { redirect } from 'next/navigation';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from '@convex-dev/auth/nextjs/server';
import { api } from '../../../convex/_generated/api';

export async function GET() {
  if (!isAuthenticatedNextjs()) {
    return redirect('/auth');
  }
  const { hasAccess } = await fetchQuery(
    api.users.getUserAccess,
    {},
    {
      token: convexAuthNextjsToken(),
    },
  );
  if (!hasAccess) {
    return redirect('/access');
  }
  const { slug } = await fetchMutation(
    api.trips.getOrCreateLatestTrip,
    {},
    {
      token: convexAuthNextjsToken(),
    },
  );
  return redirect(`/t/${slug}`);
}

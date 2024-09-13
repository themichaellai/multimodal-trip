import { redirect } from 'next/navigation';
import { fetchMutation } from 'convex/nextjs';
import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from '@convex-dev/auth/nextjs/server';
import { api } from '../../../convex/_generated/api';

export async function GET() {
  if (!isAuthenticatedNextjs()) {
    return redirect('/auth');
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

import { Suspense } from 'react';
import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from '@convex-dev/auth/nextjs/server';
import { redirect } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';

import { TripGrid } from './TripGrid';
import { getUserTrips } from './trips-server';
import { TripCreateButton } from './TripCreateButton';
import { api } from '../../../convex/_generated/api';

export default async function Page() {
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

  const trips = getUserTrips();

  return (
    <div className="max-w-3xl m-auto mt-24">
      <div className="flex items-baseline gap-3">
        <h1 className="text-4xl font-bold mb-4">Trips</h1>
        <TripCreateButton />
      </div>
      <Suspense>
        <TripGrid preloadedTrips={trips} />
      </Suspense>
    </div>
  );
}

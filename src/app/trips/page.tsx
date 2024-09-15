import { Suspense } from 'react';

import { TripGrid } from './TripGrid';
import { getUserTrips } from './trips-server';
import { TripCreateButton } from './TripCreateButton';

export default function Page() {
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

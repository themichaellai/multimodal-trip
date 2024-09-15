import { Suspense } from 'react';

import { TripGrid } from './TripGrid';
import { getUserTrips } from './trips-server';

export default function Page() {
  const trips = getUserTrips();

  return (
    <div className="max-w-3xl m-auto mt-24">
      <h1 className="text-4xl font-bold mb-4">Trips</h1>
      <Suspense>
        <TripGrid preloadedTrips={trips} />
      </Suspense>
    </div>
  );
}

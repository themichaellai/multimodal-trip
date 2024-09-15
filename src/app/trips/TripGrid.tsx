'use client';

import { use } from 'react';
import { usePreloadedQuery } from 'convex/react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { type PreloadedTrips } from './trips-server';

export function TripGrid({
  preloadedTrips,
}: {
  preloadedTrips: Promise<PreloadedTrips>;
}) {
  const trips = usePreloadedQuery(use(preloadedTrips));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {trips.map((trip) => (
        <Link href={`/t/${trip.slug}`} key={trip._id} prefetch={false}>
          <Card className="cursor-pointer">
            <CardHeader>
              <CardTitle>{trip.name}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

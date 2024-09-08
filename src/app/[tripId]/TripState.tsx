'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useTripState(tripSlug: string) {
  const trip = useQuery(api.trips.getBySlug, { slug: tripSlug });
  const addMarker = useMutation(api.trips.addStop);
  return {
    trip: trip?.trip ?? null,
    stops: trip?.stops ?? [],
    addMarker,
  };
}

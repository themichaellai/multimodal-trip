'use client';

import { addStopToTrip, db } from '../../lib/db';

interface LatLng {
  lat: number;
  lng: number;
}

export function useTripState(tripSlug: string) {
  const stopsQuery = db.useQuery({
    trips: {
      $: {
        where: { slug: tripSlug },
      },
      stops: {},
    },
  });
  const addMarker = (marker: { coords: LatLng; placeId: string | null }) => {
    addStopToTrip(tripSlug, marker.coords);
  };
  return {
    trip:
      stopsQuery.data == null || stopsQuery.data.trips.length === 0
        ? null
        : stopsQuery.data.trips[0],
    addMarker,
  };
}

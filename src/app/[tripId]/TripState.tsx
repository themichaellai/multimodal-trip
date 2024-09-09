'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';

export function useTripState(tripSlug: string) {
  const trip = useQuery(api.trips.getBySlug, { slug: tripSlug });
  const addStop = useMutation(api.trips.addStop).withOptimisticUpdate(
    (localStore, args) => {
      const trip = localStore.getQuery(api.trips.getBySlug, { slug: tripSlug });
      if (trip == null) {
        return;
      }
      const newId =
        `new-stop-${Math.floor(Math.random() * 10000)}` as Id<'stops'>;
      localStore.setQuery(
        api.trips.getBySlug,
        { slug: tripSlug },
        {
          ...trip,
          trip: {
            ...trip.trip,
            stops: [...trip.trip.stops, newId],
          },
          stops: [
            ...trip.stops,
            {
              _id: newId,
              _creationTime: 0,
              lat: args.stop.lat,
              lng: args.stop.lng,
              name: args.stop.name,
              tripId: trip.trip._id,
            },
          ],
        },
      );
    },
  );
  const removeStop = useMutation(api.trips.removeStop).withOptimisticUpdate(
    (localStore, args) => {
      const trip = localStore.getQuery(api.trips.getBySlug, { slug: tripSlug });
      if (trip == null) {
        return;
      }
      localStore.setQuery(
        api.trips.getBySlug,
        { slug: tripSlug },
        {
          ...trip,
          trip: {
            ...trip.trip,
            stops: trip.trip.stops.filter((s) => s !== args.stopId),
          },
          stops: trip.stops.filter((s) => s._id !== args.stopId),
        },
      );
    },
  );

  const initTransitTimeEstimate = useMutation(
    api.trips.initTransitTimeEstimate,
  );

  const estimatesByStops = new Map(
    (trip?.estimates ?? []).map(
      (est) =>
        [`${est.stopIdFirst}--${est.stopIdSecond}`, est.estimate] as const,
    ),
  );

  const selectTransitTimeEstimateMode = useMutation(
    api.trips.selectTransitTimeEstimateMode,
  );
  return {
    trip: trip?.trip ?? null,
    stops: trip?.stops ?? [],
    addStop,
    removeStop,
    estimatesByStops,
    initTransitTimeEstimate,
    selectTransitTimeEstimateMode,
  };
}

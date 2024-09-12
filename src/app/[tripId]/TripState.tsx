'use client';

import {
  createContext,
  PropsWithChildren,
  useMemo,
  useState,
  use,
  Dispatch,
  SetStateAction,
  ContextType,
} from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export function useTripState(tripSlug: string) {
  const trip = useQuery(api.trips.getBySlug, { slug: tripSlug });
  const estimateSteps = useQuery(api.trips.getTransitTimeEstimateSteps, {
    tripSlug,
  });

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
      (est) => [`${est.stopIdFirst}--${est.stopIdSecond}`, est] as const,
    ),
  );
  const estimatesById = new Map(
    (trip?.estimates ?? []).map((est) => [est._id, est.estimate] as const),
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
    estimatesById,
    initTransitTimeEstimate,
    selectTransitTimeEstimateMode,
    estimateSteps,
  };
}

interface EstimateHoverState {
  id: Id<'transitTimes'>;
  mode: 'transit' | 'walk' | 'bicycle';
}
const estimateHoverContext = createContext<{
  estimate: EstimateHoverState | null;
  setEstimate: Dispatch<SetStateAction<EstimateHoverState | null>>;
} | null>(null);
export function EstimateHoverContext(props: PropsWithChildren) {
  const [selectedEstimate, setSelectedEstimate] =
    useState<EstimateHoverState | null>(null);
  const val = useMemo(
    (): ContextType<typeof estimateHoverContext> => ({
      estimate: selectedEstimate,
      setEstimate: setSelectedEstimate,
    }),
    [selectedEstimate, setSelectedEstimate],
  );
  return (
    <estimateHoverContext.Provider value={val}>
      {props.children}
    </estimateHoverContext.Provider>
  );
}
export const useEstimateHover = () => {
  const ctx = use(estimateHoverContext);
  if (ctx == null) {
    throw new Error(
      'useEstimateHover must be used inside EstimateHoverContext',
    );
  }
  return ctx;
};

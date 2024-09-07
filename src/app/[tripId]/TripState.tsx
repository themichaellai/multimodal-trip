'use client';

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { addStopToTrip, db } from '../../lib/db';

interface LatLng {
  lat: number;
  lng: number;
}
interface Marker {
  coords: LatLng;
  placeId: string | null;
}

interface TripState {
  markers: Marker[];
}

interface TripStateContext {
  state: TripState;

  addMarker: (marker: Marker) => void;
}

const tripStateContext = createContext<TripStateContext | null>(null);

export function useTripState() {
  const context = useContext(tripStateContext);
  if (context == null) {
    throw new Error('useTripState must be used within a TripStateContext');
  }
  return context;
}

export function TripStateProvider({
  children,
  tripSlug,
}: PropsWithChildren<{ tripSlug: string }>) {
  const { data: stopsData } = db.useQuery({
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
  const state = useMemo((): TripState => {
    if (stopsData == null || stopsData.trips.length === 0) {
      return { markers: [] };
    }
    return {
      markers: stopsData.trips[0].stops.map(
        (s): Marker => ({
          coords: { lat: s.lat, lng: s.lng },
          placeId: null,
        }),
      ),
    };
  }, [stopsData]);
  return (
    <tripStateContext.Provider
      value={{
        addMarker,
        state,
      }}
    >
      {children}
    </tripStateContext.Provider>
  );
}

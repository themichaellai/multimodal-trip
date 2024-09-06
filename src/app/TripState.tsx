'use client';

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';

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

export function TripStateProvider({ children }: PropsWithChildren) {
  const [markers, setMarkers] = React.useState<Array<Marker>>([]);
  const addMarker = (marker: { coords: LatLng; placeId: string | null }) => {
    setMarkers((prevMarkers) => [...prevMarkers, marker]);
  };
  const state = useMemo(() => ({ markers }), [markers]);
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

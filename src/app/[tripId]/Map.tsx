'use client';

import {
  AdvancedMarker,
  Map as GoogleMap,
  MapProps,
} from '@vis.gl/react-google-maps';

import { useTripState } from './TripState';

const GOOGLE_MAP_ID = '6506bf1b2b7e5dd';

export default function Map(
  props: MapProps & {
    tripSlug: string;
  },
) {
  const { trip, stops, addMarker } = useTripState(props.tripSlug);
  return (
    <GoogleMap
      style={{ width: '100%', height: '100%' }}
      defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
      defaultZoom={12}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      mapId={GOOGLE_MAP_ID}
      onClick={(e) => {
        console.log('onClick', trip);
        if (trip == null) {
          return;
        }
        if (e.detail.latLng == null) {
          console.log('type', e.type);
          return;
        }
        addMarker({
          stop: {
            lat: e.detail.latLng.lat,
            lng: e.detail.latLng.lng,
            name: null,
          },
          tripId: trip?._id,
        });
      }}
      {...props}
    >
      {stops.map((s, i) => (
        <AdvancedMarker key={i} position={{ lat: s.lat, lng: s.lng }} />
      ))}
    </GoogleMap>
  );
}

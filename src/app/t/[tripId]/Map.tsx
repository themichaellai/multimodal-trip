'use client';

import {
  AdvancedMarker,
  Map as GoogleMap,
  MapProps,
} from '@vis.gl/react-google-maps';

import { Polyline } from '@/components/Polyline';
import { useEstimateHover, useTripStatePreloaded } from './TripState';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import { use, useMemo } from 'react';
import {
  type PreloadedTripSteps,
  type PreloadedTrip,
} from './trip-state-server';
import { decode } from '@googlemaps/polyline-codec';

const GOOGLE_MAP_ID = '6506bf1b2b7e5dd';

const transitTypeToPolylineStrokeColor = {
  // These are all generally the 500 colors from the tailwind palette
  walk: 'rgb(59 130 246)', // blue
  transit: 'rgb(239 68 68)',
  bicycle: 'rgb(34 197 94)',
  unknown: 'black',
} as const;

const transitTypeToPolylineStrokeColorLight = {
  walk: 'rgb(191 219 254)', // blue-200
  transit: 'rgb(254 202 202)', // red-200
  bicycle: 'rgb(187 247 208)', // green-200
  unknown: 'black',
} as const;

const sanFranciscoBounds = {
  north: 37.81,
  south: 37.7,
  east: -122.35,
  west: -122.52,
};

export default function Map(
  props: MapProps & {
    tripSlug: string;
    trip: Promise<PreloadedTrip>;
    estimateSteps: Promise<PreloadedTripSteps>;
  },
) {
  const { trip, stops, addStop, estimatesById, estimateSteps, isOwner } =
    useTripStatePreloaded(
      props.tripSlug,
      use(props.trip),
      use(props.estimateSteps),
    );
  const polylines = useMemo(
    () =>
      estimateSteps == null
        ? []
        : estimateSteps.flatMap((s) => {
            return s.tripSteps
              .map((step) =>
                step.polyline == null
                  ? null
                  : {
                      id: step._id,
                      polyline: step.polyline,
                      stepMode: step.stepMode,
                      tripMode: step.tripMode,
                      transitTimeId: step.transitTimeId,
                    },
              )
              .filter((s) => s != null)
              .filter(
                (s) => (estimatesById.get(s.transitTimeId) ?? null) != null,
              );
          }),
    [estimateSteps, estimatesById],
  );

  const bounds = useMemo(() => {
    if (stops.length === 0 && polylines.length === 0) {
      return sanFranciscoBounds;
    }

    const initialBounds = {
      north: -Infinity,
      south: Infinity,
      east: -Infinity,
      west: Infinity,
    };

    // Calculate bounds for stops
    const stopBounds = stops.reduce(
      (acc, stop) => ({
        north: Math.max(acc.north, stop.lat),
        south: Math.min(acc.south, stop.lat),
        east: Math.max(acc.east, stop.lng),
        west: Math.min(acc.west, stop.lng),
      }),
      initialBounds,
    );

    // Calculate bounds for polylines
    const finalBounds = polylines.reduce((acc, p) => {
      const decodedPath = decode(p.polyline);
      return decodedPath.reduce(
        (pathAcc, [lat, lng]) => ({
          north: Math.max(pathAcc.north, lat),
          south: Math.min(pathAcc.south, lat),
          east: Math.max(pathAcc.east, lng),
          west: Math.min(pathAcc.west, lng),
        }),
        acc,
      );
    }, stopBounds);

    return finalBounds;
  }, [stops, polylines]);

  return (
    <GoogleMap
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '6px',
      }}
      defaultBounds={{
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
        padding: 50, // Add some padding around the bounds
      }}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      mapId={GOOGLE_MAP_ID}
      onClick={(e) => {
        if (!isOwner) {
          return;
        }
        if (trip == null) {
          return;
        }
        if (e.detail.latLng == null) {
          return;
        }
        addStop({
          stop: {
            lat: e.detail.latLng.lat,
            lng: e.detail.latLng.lng,
            name: null,
            googlePlaceId: e.detail.placeId ?? null,
          },
          tripId: trip?._id,
        });
      }}
      {...props}
    >
      {stops.map((s, i) => (
        <AdvancedMarker key={i} position={{ lat: s.lat, lng: s.lng }} />
      ))}
      {polylines.map((p) => (
        <EstimateStopPolyline
          key={p.id}
          polyline={p.polyline}
          stepMode={p.stepMode}
          stepTripMode={p.tripMode}
          estimateId={p.transitTimeId}
          estimate={estimatesById.get(p.transitTimeId) ?? null}
        />
      ))}
    </GoogleMap>
  );
}

function EstimateStopPolyline({
  polyline,
  stepMode,
  stepTripMode,
  estimate,
  estimateId,
}: {
  polyline: string;
  stepMode: Doc<'tripSteps'>['stepMode'];
  stepTripMode: Doc<'tripSteps'>['tripMode'];
  estimate: Doc<'transitTimes'>['estimate'] | null;
  estimateId: Id<'transitTimes'>;
}) {
  const { setEstimate: setEstimateId, estimate: estimateHovered } =
    useEstimateHover();
  if (estimate == null) {
    return null;
  }
  if (estimate.type === 'selection' && estimate.mode !== stepTripMode) {
    return null;
  }
  const estimateIsSelection = estimate.type === 'selection';

  // Don't show polyline if
  // 1. the estimate is a "list"
  // 2. the polyline's trip mode is not the same as the hovered mode
  if (
    estimate.type === 'list' &&
    estimateHovered?.id === estimateId &&
    estimateHovered?.mode !== stepTripMode
  ) {
    return null;
  }

  return (
    <Polyline
      strokeColor={
        estimateIsSelection ||
        (estimateHovered?.id === estimateId &&
          estimateHovered?.mode === stepTripMode)
          ? transitTypeToPolylineStrokeColor[stepMode]
          : transitTypeToPolylineStrokeColorLight[stepMode]
      }
      onMouseOver={() => {
        setEstimateId({
          id: estimateId,
          mode: stepTripMode,
        });
      }}
      onMouseOut={() => {
        setEstimateId((curr) => (curr?.id === estimateId ? null : curr));
      }}
      strokeWeight={estimateIsSelection ? 5 : 3}
      encodedPath={polyline}
    />
  );
}

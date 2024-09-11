'use client';

import {
  AdvancedMarker,
  Map as GoogleMap,
  MapProps,
} from '@vis.gl/react-google-maps';

import { Polyline } from '@/components/Polyline';
import { useEstimateHover, useTripState } from './TripState';
import { Doc, Id } from '../../../convex/_generated/dataModel';

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

export default function Map(
  props: MapProps & {
    tripSlug: string;
  },
) {
  const { trip, stops, addStop, estimatesById, estimateSteps } = useTripState(
    props.tripSlug,
  );
  const polylines =
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
        });

  return (
    <GoogleMap
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '6px',
      }}
      defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
      defaultZoom={12}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      mapId={GOOGLE_MAP_ID}
      onClick={(e) => {
        if (trip == null) {
          return;
        }
        if (e.detail.latLng == null) {
          console.log('type', e.type);
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
  const { setEstimateId, estimate: estimateHovered } = useEstimateHover();
  if (estimate == null) {
    return null;
  }
  if (estimate.type === 'selection' && estimate.mode !== stepMode) {
    return null;
  }
  const isSelection = estimate.type === 'selection';
  return (
    <Polyline
      strokeColor={
        isSelection ||
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
      strokeWeight={isSelection ? 5 : 3}
      encodedPath={polyline}
    />
  );
}

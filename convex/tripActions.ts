'use node';

import { v } from 'convex/values';
import { Client as MapsClient } from '@googlemaps/google-maps-services-js';
import { RoutesClient, protos } from '@googlemaps/routing';

import { internalAction } from './_generated/server';
import { api, internal } from './_generated/api';

const googleMapsClient = new MapsClient({});
const googleRoutingClient = new RoutesClient({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const getStopName = internalAction({
  args: { stopId: v.id('stops'), placeId: v.string() },
  handler: async (ctx, params) => {
    const resp = await googleMapsClient.placeDetails({
      params: {
        place_id: params.placeId,
        key: process.env.GOOGLE_API_KEY ?? '',
        fields: ['name'],
      },
    });
    await ctx.runMutation(api.trips.setStopName, {
      stopId: params.stopId,
      name: resp.data.result.name ?? 'Place',
    });
  },
});

const parseSeconds = <T extends unknown>(secs: T): number | null => {
  if (typeof secs === 'string' && !isNaN(Number(secs))) {
    return parseInt(secs, 10);
  }
  return null;
};

const normalizeTransitMode = (
  mode:
    | keyof typeof protos.google.maps.routing.v2.RouteTravelMode
    | null
    | undefined
    | number,
): 'transit' | 'walk' | 'bicycle' | 'unknown' => {
  if (mode == null) {
    return 'unknown';
  }
  if (typeof mode === 'number') {
    return 'unknown';
  }
  switch (mode) {
    case 'TRANSIT':
      return 'transit';
    case 'WALK':
      return 'walk';
    case 'BICYCLE':
      return 'bicycle';
    default:
      return 'unknown';
  }
};

export const refreshTransitTimeEstimates = internalAction({
  args: {
    stopIdFirst: v.id('stops'),
    stopIdSecond: v.id('stops'),
    throwAwayResults: v.optional(v.boolean()),
  },
  handler: async (ctx, params) => {
    // add validation for stops
    const [stopFirst, stopSecond] = await Promise.all([
      ctx.runQuery(internal.trips.getStopById, { stopId: params.stopIdFirst }),
      ctx.runQuery(internal.trips.getStopById, { stopId: params.stopIdSecond }),
    ]);
    if (stopFirst == null || stopSecond == null) {
      return;
    }
    const routeResps = await Promise.all(
      (['TRANSIT', 'WALK', 'BICYCLE'] as const).map((travelMode) =>
        // https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
        googleRoutingClient.computeRoutes(
          {
            origin: {
              location: {
                latLng: { latitude: stopFirst.lat, longitude: stopFirst.lng },
              },
            },
            destination: {
              location: {
                latLng: { latitude: stopSecond.lat, longitude: stopSecond.lng },
              },
            },
            //computeAlternativeRoutes: true,
            travelMode,
          },
          {
            otherArgs: {
              headers: {
                'X-Goog-FieldMask': [
                  'routes.legs.duration',
                  'routes.legs.steps.staticDuration',
                  'routes.legs.steps.travelMode',
                  'routes.legs.steps.polyline.encodedPolyline',
                ].join(','),
              },
            },
          },
        ),
      ),
    );

    if (params.throwAwayResults) {
      return;
    }

    const routeSteps: Array<{
      durationSeconds: number | null;
      steps: Array<{
        seconds: number;
        stepMode: 'transit' | 'bicycle' | 'walk' | 'unknown';
        polyline: string | null;
      }>;
    }> = routeResps.map((routeResp, index) => {
      const route = routeResp[0].routes?.[0];
      const steps =
        route?.legs?.flatMap(
          (leg) =>
            leg.steps?.map((step) => ({
              // TODO: this lazily sets nulls to 0, which is probably not what
              // we want
              seconds: parseSeconds(step.staticDuration?.seconds) ?? 0,
              stepMode: normalizeTransitMode(step.travelMode),
              polyline: step.polyline?.encodedPolyline ?? null,
            })) ?? [],
        ) ?? [];
      const durationSeconds =
        route?.legs
          ?.map((leg) => parseSeconds(leg.duration?.seconds))
          .reduce<number>((acc, val) => acc + (val ?? 0), 0) ?? null;
      return { durationSeconds, steps };
    });

    await ctx.scheduler.runAfter(0, internal.trips.setTransitTimeEstimate, {
      stopIdFirst: params.stopIdFirst,
      stopIdSecond: params.stopIdSecond,
      estimate: {
        transit: {
          seconds: routeSteps[0].durationSeconds,
          steps: routeSteps[0].steps,
        },
        walk: {
          seconds: routeSteps[1].durationSeconds,
          steps: routeSteps[1].steps,
        },
        bicycle: {
          seconds: routeSteps[2].durationSeconds,
          steps: routeSteps[2].steps,
        },
      },
    });
  },
});

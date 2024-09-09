'use node';

import { v } from 'convex/values';
import { Client as MapsClient } from '@googlemaps/google-maps-services-js';
import { RoutesClient } from '@googlemaps/routing';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';

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
    await ctx.runMutation(internal.trips.setStopName, {
      stopId: params.stopId,
      name: resp.data.result.name ?? 'Place',
    });
  },
});

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
                  'routes.duration',
                  'routes.legs.steps.staticDuration',
                  'routes.legs.steps.travelMode',
                  'routes.legs.duration',

                  //'routes.legs.*',
                  //'routes.legs.steps.*',
                ].join(','),
              },
            },
          },
        ),
      ),
    );
    const routeDurationSeconds = routeResps.map((resp): number | null => {
      const legsSeconds =
        resp[0].routes?.[0].legs?.map((leg) => {
          const secs = leg.duration?.seconds;
          if (typeof secs === 'string' && !isNaN(Number(secs))) {
            return parseInt(secs, 10);
          }
          return null;
        }) ?? [];
      const legsSecondsNonNil = legsSeconds.filter((s) => s != null);
      if (legsSeconds.length !== legsSecondsNonNil.length) {
        console.warn('got some non-number durations on leg', legsSeconds);
        return null;
      }
      const sumSecs = legsSecondsNonNil.reduce((acc, val) => acc + val, 0);
      return sumSecs;
    });
    if (
      routeDurationSeconds.some(
        (duration) => duration != null && typeof duration !== 'number',
      )
    ) {
      console.warn('got some non-number durations', routeDurationSeconds);
    }
    const [transitSeconds, walkSeconds, bicycleSeconds] =
      routeDurationSeconds.map((d) =>
        d == null || typeof d === 'number' ? d : null,
      );

    if (params.throwAwayResults) {
      return;
    }
    await ctx.scheduler.runAfter(0, internal.trips.setTransitTimeEstimate, {
      stopIdFirst: params.stopIdFirst,
      stopIdSecond: params.stopIdSecond,
      estimate: {
        transitSeconds,
        walkSeconds,
        bicycleSeconds,
      },
    });
  },
});

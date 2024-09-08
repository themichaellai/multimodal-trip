'use node';

import { v } from 'convex/values';
import { Client } from '@googlemaps/google-maps-services-js';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';

const googleMapsClient = new Client({});

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

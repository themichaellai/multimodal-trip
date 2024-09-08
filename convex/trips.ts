import { customAlphabet } from 'nanoid';

import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

// "nolookalikes" from nanoid-dictionary
const nanoid = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',
  14,
);
const createSlug = (): string => nanoid();

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (
    ctx,
    params,
  ): Promise<{
    trip: Doc<'trips'>;
    stops: Array<Doc<'stops'>>;
  } | null> => {
    const trip = await ctx.db
      .query('trips')
      .filter((q) => q.eq(q.field('slug'), params.slug))
      .first();
    if (trip == null) {
      return null;
    }
    const stops = await ctx.db
      .query('stops')
      .filter((q) => q.or(...trip.stops.map((s) => q.eq(q.field('_id'), s))))
      .collect();
    return {
      trip,
      stops: stops.sort(
        (a, b) => trip.stops.indexOf(a._id) - trip.stops.indexOf(b._id),
      ),
    };
  },
});

export const createTrip = mutation({
  args: {},
  handler: async (ctx): Promise<{ id: Doc<'trips'>['_id']; slug: string }> => {
    for (const _ of Array(10)) {
      const slug = createSlug();
      const existingTrip = await ctx.db
        .query('trips')
        .filter((q) => q.eq(q.field('slug'), slug))
        .first();
      if (existingTrip == null) {
        const tripId = await ctx.db.insert('trips', { slug, stops: [] });
        return { id: tripId, slug };
      }
    }
    throw new Error('failed to create trip');
  },
});

export const setStopName = internalMutation({
  args: { stopId: v.id('stops'), name: v.string() },
  handler: async (ctx, params) => {
    await ctx.db.patch(params.stopId, { name: params.name });
  },
});

export const addStop = mutation({
  args: {
    tripId: v.id('trips'),
    stop: v.object({
      name: v.union(v.string(), v.null()),
      lat: v.number(),
      lng: v.number(),
      googlePlaceId: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, params) => {
    const trip = await ctx.db
      .query('trips')
      .filter((q) => q.eq(q.field('_id'), params.tripId))
      .first();
    if (trip == null) {
      return;
    }
    const newStopId = await ctx.db.insert('stops', {
      lat: params.stop.lat,
      lng: params.stop.lng,
      name: params.stop.name,
      tripId: trip._id,
    });
    await ctx.db.patch(trip._id, {
      stops: [...trip.stops, newStopId],
    });
    if (params.stop.googlePlaceId != null) {
      await ctx.scheduler.runAfter(0, internal.tripActions.getStopName, {
        stopId: newStopId,
        placeId: params.stop.googlePlaceId,
      });
    }
  },
});

export const removeStop = mutation({
  args: {
    stopId: v.id('stops'),
  },
  handler: async (ctx, params) => {
    const stop = await ctx.db
      .query('stops')
      .filter((q) => q.eq(q.field('_id'), params.stopId))
      .first();
    if (stop == null) {
      return;
    }
    const trip = await ctx.db
      .query('trips')
      .filter((q) => q.eq(q.field('_id'), stop.tripId))
      .first();

    await ctx.db.delete(params.stopId);
    if (trip != null) {
      await ctx.db.patch(trip._id, {
        stops: trip.stops.filter((s) => s !== params.stopId),
      });
    }
  },
});

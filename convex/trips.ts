import { customAlphabet } from 'nanoid';

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';

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

export const addStop = mutation({
  args: {
    tripId: v.id('trips'),
    stop: v.object({
      name: v.union(v.string(), v.null()),
      lat: v.number(),
      lng: v.number(),
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
    const newStopId = await ctx.db.insert('stops', params.stop);
    await ctx.db.patch(trip._id, {
      stops: [...trip.stops, newStopId],
    });
  },
});

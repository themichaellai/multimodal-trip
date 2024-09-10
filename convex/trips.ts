import { customAlphabet } from 'nanoid';

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

// "nolookalikes" from nanoid-dictionary
const nanoid = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',
  14,
);
const createSlug = (): string => nanoid();

type Stop = Doc<'stops'>;

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (
    ctx,
    params,
  ): Promise<{
    trip: Doc<'trips'>;
    stops: Array<Doc<'stops'>>;
    estimates: Array<Doc<'transitTimes'>>;
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

    const estimates = await ctx.db
      .query('transitTimes')
      .filter((q) =>
        q.or(...trip.stops.map((s) => q.eq(q.field('stopIdFirst'), s))),
      )
      .collect();
    return {
      trip,
      stops: stops.sort(
        (a, b) => trip.stops.indexOf(a._id) - trip.stops.indexOf(b._id),
      ),
      estimates,
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

export const getStopById = internalQuery({
  args: { stopId: v.id('stops') },
  handler: async (ctx, params): Promise<Stop | null> => {
    return ctx.db.get(params.stopId);
  },
});

export const initTransitTimeEstimate = mutation({
  args: {
    stopIdFirst: v.id('stops'),
    stopIdSecond: v.id('stops'),
  },
  handler: async (ctx, params) => {
    // TODO: Add rate limiting
    const existing = await ctx.db
      .query('transitTimes')
      .filter((q) =>
        q.and(
          q.eq(q.field('stopIdFirst'), params.stopIdFirst),
          q.eq(q.field('stopIdSecond'), params.stopIdSecond),
        ),
      )
      .first();
    if (existing == null) {
      await ctx.db.insert('transitTimes', {
        stopIdFirst: params.stopIdFirst,
        stopIdSecond: params.stopIdSecond,
        estimate: null,
      });
    } else {
      await ctx.db.patch(existing._id, { estimate: null });
    }
    ctx.scheduler.runAfter(
      0,
      internal.tripActions.refreshTransitTimeEstimates,
      {
        stopIdFirst: params.stopIdFirst,
        stopIdSecond: params.stopIdSecond,
      },
    );
  },
});

const stepMode = () =>
  v.union(
    v.literal('transit'),
    v.literal('bicycle'),
    v.literal('walk'),
    v.literal('unknown'),
  );
const stepSchema = v.object({
  stepMode: stepMode(),
  seconds: v.number(),
  polyline: v.union(v.string(), v.null()),
});

export const setTransitTimeEstimate = internalMutation({
  args: {
    stopIdFirst: v.id('stops'),
    stopIdSecond: v.id('stops'),
    estimate: v.object({
      walk: v.object({
        seconds: v.union(v.number(), v.null()),
        steps: v.array(stepSchema),
      }),
      transit: v.object({
        seconds: v.union(v.number(), v.null()),
        steps: v.array(stepSchema),
      }),
      bicycle: v.object({
        seconds: v.union(v.number(), v.null()),
        steps: v.array(stepSchema),
      }),
    }),
  },
  handler: async (ctx, params) => {
    const existing = await ctx.db
      .query('transitTimes')
      .filter((q) =>
        q.and(
          q.eq(q.field('stopIdFirst'), params.stopIdFirst),
          q.eq(q.field('stopIdSecond'), params.stopIdSecond),
        ),
      )
      .first();

    let transitTimeId;
    if (existing == null) {
      transitTimeId = await ctx.db.insert('transitTimes', {
        stopIdFirst: params.stopIdFirst,
        stopIdSecond: params.stopIdSecond,
        estimate: {
          type: 'list',
          walkSeconds: params.estimate.walk.seconds,
          transitSeconds: params.estimate.transit.seconds,
          bicycleSeconds: params.estimate.bicycle.seconds,
        },
      });
    } else {
      transitTimeId = existing._id;
      await ctx.db.patch(transitTimeId, {
        estimate: {
          type: 'list',
          walkSeconds: params.estimate.walk.seconds,
          transitSeconds: params.estimate.transit.seconds,
          bicycleSeconds: params.estimate.bicycle.seconds,
        },
      });
    }

    // Delete existing steps for this transitTime
    const steps = await ctx.db
      .query('tripSteps')
      .filter((q) => q.eq(q.field('transitTimeId'), transitTimeId))
      .collect();
    await Promise.all(steps.map((step) => ctx.db.delete(step._id)));

    // Insert new steps
    for (const mode of ['walk', 'transit', 'bicycle'] as const) {
      for (const [index, step] of Array.from(
        params.estimate[mode].steps.entries(),
      )) {
        await ctx.db.insert('tripSteps', {
          transitTimeId,
          tripMode: mode,
          stepIndex: index,
          stepMode: step.stepMode,
          seconds: step.seconds,
          polyline: step.polyline,
        });
      }
    }
  },
});

export const selectTransitTimeEstimateMode = mutation({
  args: {
    stopIdFirst: v.id('stops'),
    stopIdSecond: v.id('stops'),
    mode: v.union(
      v.literal('walk'),
      v.literal('transit'),
      v.literal('bicycle'),
    ),
  },
  handler: async (ctx, params) => {
    const existing = await ctx.db
      .query('transitTimes')
      .filter((q) =>
        q.and(
          q.eq(q.field('stopIdFirst'), params.stopIdFirst),
          q.eq(q.field('stopIdSecond'), params.stopIdSecond),
        ),
      )
      .first();
    if (
      existing == null ||
      (existing.estimate != null &&
        !(
          'walkSeconds' in existing.estimate &&
          'transitSeconds' in existing.estimate
        ))
    ) {
      return;
    }
    await ctx.db.patch(existing._id, {
      estimate: {
        type: 'selection',
        mode: params.mode,
        seconds: existing.estimate?.[`${params.mode}Seconds`] ?? null,
      },
    });
  },
});

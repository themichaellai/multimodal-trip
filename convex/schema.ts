import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const transitMode = () =>
  v.union(v.literal('transit'), v.literal('bicycle'), v.literal('walk'));

export default defineSchema({
  ...authTables,
  trips: defineTable({
    slug: v.string(),
    stops: v.array(v.id('stops')),
    owner: v.id('users'),
  }),
  stops: defineTable({
    name: v.union(v.string(), v.null()),
    tripId: v.id('trips'),
    lat: v.number(),
    lng: v.number(),
  }),
  transitTimes: defineTable({
    stopIdFirst: v.id('stops'),
    stopIdSecond: v.id('stops'),
    estimate: v.union(
      v.object({
        type: v.literal('list'),
        walkSeconds: v.union(v.number(), v.null()),
        transitSeconds: v.union(v.number(), v.null()),
        bicycleSeconds: v.union(v.number(), v.null()),
      }),
      v.object({
        type: v.literal('selection'),
        mode: transitMode(),
        seconds: v.union(v.number(), v.null()),
      }),
      v.null(),
    ),
  }),
  tripSteps: defineTable({
    transitTimeId: v.id('transitTimes'),
    tripMode: transitMode(),
    stepIndex: v.number(),
    stepMode: v.union(
      // Include unknown while unsure about how often the other types will be
      // used
      v.literal('unknown'),
      v.literal('transit'),
      v.literal('bicycle'),
      v.literal('walk'),
    ),
    seconds: v.number(),
    polyline: v.union(v.string(), v.null()),
  }),
});

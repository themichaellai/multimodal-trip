import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  trips: defineTable({
    slug: v.string(),
    stops: v.array(v.id('stops')),
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
        mode: v.union(
          v.literal('transit'),
          v.literal('bicycle'),
          v.literal('walk'),
        ),
        seconds: v.union(v.number(), v.null()),
      }),
      v.null(),
    ),
  }),
});

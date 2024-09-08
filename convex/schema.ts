import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  trips: defineTable({
    slug: v.string(),
    stops: v.array(v.id('stops')),
  }),
  stops: defineTable({
    name: v.union(v.string(), v.null()),
    lat: v.number(),
    lng: v.number(),
  }),
});

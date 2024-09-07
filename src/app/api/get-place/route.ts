import { Client } from '@googlemaps/google-maps-services-js';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { setStopName } from '../../../lib/db-admin';

const googleMapsClient = new Client({});

const placeDetailsRequestSchema = z.object({
  place_id: z.string(),
  stop_id: z.string(),
});

export async function POST(request: NextRequest) {
  const reqBody = placeDetailsRequestSchema.safeParse(await request.json());
  if (!reqBody.success) {
    console.warn(JSON.stringify(reqBody.error.errors));
    return new Response('invalid request body', { status: 400 });
  }

  const resp = await googleMapsClient.placeDetails({
    params: {
      place_id: reqBody.data.place_id,
      key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? '',
      fields: ['name'],
    },
  });
  await setStopName(reqBody.data.stop_id, resp.data.result.name ?? 'Place');
  return Response.json({ ok: true });
}

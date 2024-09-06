import { Client } from '@googlemaps/google-maps-services-js';
import { type NextRequest } from 'next/server';

const googleMapsClient = new Client({});

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('place_id');
  if (placeId == null) {
    return new Response('Missing place_id', { status: 400 });
  }
  console.log(
    'key',
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.slice(0, 10) ?? 'n/a',
  );
  const resp = await googleMapsClient.placeDetails({
    params: {
      place_id: placeId,
      key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? '',
      fields: ['name'],
    },
  });
  return Response.json(resp.data.result);
}

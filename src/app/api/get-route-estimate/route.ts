import 'server-only';
//import { RoutesClient } from '@googlemaps/routing';
import { type NextRequest } from 'next/server';
//import { z } from 'zod';
//
//import { getStopById, getSiblingStops, setStopName } from '../../../lib/db-admin';
//
//const googleMapsClient = new RoutesClient({});
//
//const routeEstimateReqSchema = z.object({
//  stop_a_id: z.string(),
//});

export async function POST(request: NextRequest) {
  //const reqBody = routeEstimateReqSchema.safeParse(await request.json());
  //if (!reqBody.success) {
  //  console.warn(JSON.stringify(reqBody.error.errors));
  //  return new Response('invalid request body', { status: 400 });
  //}
  //const siblingStops = await getSiblingStops(reqBody.data.stop_a_id);
  //const [stopA, stopB] = await Promise.all([
  //  getStopById(reqBody.data.stop_a_id),
  //  getStopById(reqBody.data.stop_b_id),
  //]);
  //if (stopA == null || stopB == null) {
  //  return new Response('invalid stop id', { status: 400 });
  //}

  //const resp = await googleMapsClient.computeRoutes({
  //  origin: {
  //    location: {
  //      latLng: {
  //        latitude: 37.7749,
  //        longitude: -122.4194,
  //      },
  //    },
  //  },
  //});
  //await setStopName(reqBody.data.stop_id, resp.data.result.name ?? 'Place');
  return Response.json({ ok: true });
}

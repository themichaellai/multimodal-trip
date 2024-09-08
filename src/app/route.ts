import { redirect } from 'next/navigation';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../convex/_generated/api';

export async function GET() {
  const { slug } = await fetchMutation(api.trips.createTrip, {});
  return redirect(`/${slug}`);
}

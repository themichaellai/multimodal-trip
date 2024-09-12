import { Suspense } from 'react';

import Map from './Map';
import GoogleMapsAPIProvider from './GoogleMapsApiProvider';
import Sidebar from './Sidebar';
import { EstimateHoverContext } from './TripState';
import { preloadTrip, preloadTripSteps } from './trip-state-server';

export default function Home({ params }: { params: { tripId: string } }) {
  const tripQuery = preloadTrip(params.tripId);
  const estimateSteps = preloadTripSteps(params.tripId);

  return (
    <EstimateHoverContext>
      <GoogleMapsAPIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''}
      >
        <div className="flex">
          <div className="w-[80%] h-screen py-3 pl-3 rounded-md">
            <Suspense>
              <Map
                tripSlug={params.tripId}
                trip={tripQuery}
                estimateSteps={estimateSteps}
              />
            </Suspense>
          </div>
          <div className="w-[20%] mx-3 mt-3">
            <Suspense>
              <Sidebar
                tripSlug={params.tripId}
                trip={tripQuery}
                estimateSteps={estimateSteps}
              />
            </Suspense>
          </div>
        </div>
      </GoogleMapsAPIProvider>
    </EstimateHoverContext>
  );
}

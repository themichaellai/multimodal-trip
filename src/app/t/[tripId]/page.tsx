import { Suspense } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import Map from './Map';
import GoogleMapsAPIProvider from './GoogleMapsApiProvider';
import Sidebar from './Sidebar';
import { EstimateHoverContext } from './TripState';
import {
  preloadTrip,
  preloadTripSteps,
  preloadUser,
} from './trip-state-server';
import { TripHeader } from './Header';

export default function Home({ params }: { params: { tripId: string } }) {
  const tripQuery = preloadTrip(params.tripId);
  const estimateSteps = preloadTripSteps(params.tripId);
  const userId = preloadUser();

  return (
    <TooltipProvider>
      <EstimateHoverContext>
        <GoogleMapsAPIProvider
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''}
        >
          <div className="flex flex-col gap-3 px-6 pt-3 h-screen">
            <Suspense>
              <TripHeader
                estimateSteps={estimateSteps}
                trip={tripQuery}
                tripSlug={params.tripId}
                user={userId}
              />
            </Suspense>
            <div className="flex flex-1 mb-3">
              <div className="w-[80%] rounded-md">
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
          </div>
        </GoogleMapsAPIProvider>
      </EstimateHoverContext>
    </TooltipProvider>
  );
}

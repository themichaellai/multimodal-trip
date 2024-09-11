import Map from './Map';
import GoogleMapsAPIProvider from './GoogleMapsApiProvider';
import Sidebar from './Sidebar';
import { EstimateHoverContext } from './TripState';

export default function Home({ params }: { params: { tripId: string } }) {
  return (
    <EstimateHoverContext>
      <GoogleMapsAPIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''}
      >
        <div className="flex">
          <div className="w-[80%] h-screen py-3 pl-3 rounded-md">
            <Map tripSlug={params.tripId} />
          </div>
          <div className="w-[20%] mx-3 mt-3">
            <Sidebar tripSlug={params.tripId} />
          </div>
        </div>
      </GoogleMapsAPIProvider>
    </EstimateHoverContext>
  );
}

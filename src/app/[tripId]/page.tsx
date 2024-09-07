import Map from './Map';
import GoogleMapsAPIProvider from './GoogleMapsApiProvider';
import Sidebar from './Sidebar';

export default function Home({ params }: { params: { tripId: string } }) {
  return (
    <GoogleMapsAPIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''}
    >
      <div className="flex">
        <div className="w-[80%] h-screen">
          <Map tripSlug={params.tripId} />
        </div>
        <div className="mx-3 mt-3">
          <Sidebar tripSlug={params.tripId} />
        </div>
      </div>
    </GoogleMapsAPIProvider>
  );
}

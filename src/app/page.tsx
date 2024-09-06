import { TextSmall } from '@/components/typography';
import Map from './Map';
import { TripStateProvider } from './TripState';
import GoogleMapsAPIProvider from './GoogleMapsApiProvider';

export default function Home() {
  return (
    <GoogleMapsAPIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''}
    >
      <TripStateProvider>
        <div className="flex">
          <div className="w-[80%] h-screen">
            <Map />
          </div>
          <div className="mx-1">
            <TextSmall>Right side</TextSmall>
          </div>
        </div>
      </TripStateProvider>
    </GoogleMapsAPIProvider>
  );
}

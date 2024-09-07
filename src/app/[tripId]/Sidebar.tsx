'use client';

import { Cross2Icon } from '@radix-ui/react-icons';

import { TextSmall, TextLarge } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { useTripState } from './TripState';

export default function Sidebar() {
  const { state } = useTripState();
  return (
    <>
      <TextLarge>Stops</TextLarge>
      <ul>
        {state.markers.map((marker, index) => (
          <li key={index} className="flex items-center gap-2 py-3">
            <TextSmall>{marker.placeId ?? 'Unnamed'}</TextSmall>
            <div>
              <Button variant="outline" size="sm" className="p-1 h-auto">
                <Cross2Icon className="h-3 w-3" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

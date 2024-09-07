'use client';

import { Cross2Icon } from '@radix-ui/react-icons';

import { TextSmall, TextLarge } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { useTripState } from './TripState';
import { removeStop } from '../../lib/db';

export default function Sidebar({ tripSlug }: { tripSlug: string }) {
  const { trip } = useTripState(tripSlug);
  const stops = trip?.stops ?? [];
  return (
    <>
      <TextLarge>Stops</TextLarge>
      <ul>
        {stops.map((stop, index) => (
          <li key={stop.id} className="flex items-center gap-2 py-3">
            <TextSmall>{stop.name ?? 'Unnamed'}</TextSmall>
            <div>
              {index < stops.length - 1 ? null : (
                <Button
                  onClick={() => {
                    removeStop(stop.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="p-1 h-auto"
                >
                  <Cross2Icon className="h-3 w-3" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

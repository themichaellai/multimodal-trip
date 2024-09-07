'use client';

import {
  Cross2Icon,
  DotIcon,
  DotsVerticalIcon,
  PlusIcon,
} from '@radix-ui/react-icons';

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
      <div>
        {stops.map((stop, index) => (
          <>
            <div key={stop.id} className="flex items-center gap-2 py-3 h-9">
              <DotIcon className="h-5 w-5 text-muted-foreground" />
              <TextSmall>{stop.name ?? 'Place'}</TextSmall>
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
            </div>
            {index >= stops.length - 1 ? null : (
              <div
                key={stop.id + 'foo'}
                className="flex items-center gap-2 py-3 h-9"
              >
                <DotsVerticalIcon className="h-5 w-5 text-muted-foreground" />
                <Button variant="outline" size="sm">
                  <PlusIcon className="mr-1" /> Set transit
                </Button>
              </div>
            )}
          </>
        ))}
      </div>
    </>
  );
}

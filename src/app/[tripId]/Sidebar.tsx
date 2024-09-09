'use client';

import { Fragment } from 'react';
import {
  Cross2Icon,
  DotIcon,
  DotsVerticalIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';

import { TextSmall, TextLarge } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { useTripState } from './TripState';
import { Id } from '../../../convex/_generated/dataModel';

export default function Sidebar({ tripSlug }: { tripSlug: string }) {
  const { stops, removeStop } = useTripState(tripSlug);
  return (
    <>
      <TextLarge className="mb-1">Stops</TextLarge>
      <div>
        {stops.map((stop, index) => (
          <Fragment key={index}>
            <div key={index} className="flex items-center gap-2 py-3 h-9">
              <DotIcon className="h-5 w-5 text-muted-foreground" />
              <TextSmall className="font-semibold">
                {stop.name ?? 'Place'}
              </TextSmall>
              <div>
                {index < stops.length - 1 ? null : (
                  <Button
                    onClick={() => {
                      removeStop({ stopId: stop._id });
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
                key={stop._id + 'foo'}
                className="flex items-center gap-2 py-3"
              >
                <DotsVerticalIcon className="h-5 w-5 text-muted-foreground" />
                <TransitTimeEstimate
                  stopIdFirst={stop._id}
                  stopIdSecond={stops[index + 1]._id}
                  tripSlug={tripSlug}
                />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </>
  );
}

const secondsToString = (seconds: number | null): string => {
  if (seconds == null) {
    return '-';
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

const transitModeToEmoji = {
  walk: <>&#128694;</>,
  transit: <>&#128652;</>,
  bicycle: <>&#128690;</>,
} as const;

function TransitTimeEstimate({
  stopIdFirst,
  stopIdSecond,
  tripSlug,
}: {
  stopIdFirst: Id<'stops'>;
  stopIdSecond: Id<'stops'>;
  tripSlug: string;
}) {
  const {
    estimatesByStops,
    initTransitTimeEstimate,
    selectTransitTimeEstimateMode,
  } = useTripState(tripSlug);
  const estimateKey = `${stopIdFirst}--${stopIdSecond}` as const;
  const estimate = estimatesByStops.has(estimateKey)
    ? (estimatesByStops.get(estimateKey) ?? 'loading')
    : 'uninitialized';
  if (estimate == 'uninitialized') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          initTransitTimeEstimate({
            stopIdFirst: stopIdFirst,
            stopIdSecond: stopIdSecond,
          })
        }
      >
        <ReloadIcon className="mr-1 h-3 w-3" /> Load transit times
      </Button>
    );
  }

  if (
    estimate === 'loading' ||
    ('type' in estimate && estimate.type === 'list')
  ) {
    const orIsLoading = (k: 'walk' | 'transit' | 'bicycle') =>
      estimate !== 'loading' ? (
        secondsToString(estimate[`${k}Seconds`])
      ) : (
        <ReloadIcon className="ml-2 h-3 w-3 animate-spin" />
      );
    return (
      <div className="flex gap-2">
        {(['walk', 'transit', 'bicycle'] as const).map((mode) => (
          <Button
            key={mode}
            variant="outline"
            size="sm"
            onClick={() =>
              selectTransitTimeEstimateMode({
                stopIdFirst: stopIdFirst,
                stopIdSecond: stopIdSecond,
                mode: mode,
              })
            }
            disabled={estimate === 'loading'}
          >
            {transitModeToEmoji[mode]} {orIsLoading(mode)}
          </Button>
        ))}
        <Button
          key="refresh"
          variant="outline"
          size="sm"
          onClick={() =>
            initTransitTimeEstimate({
              stopIdFirst: stopIdFirst,
              stopIdSecond: stopIdSecond,
            })
          }
          disabled={estimate === 'loading'}
        >
          <ReloadIcon className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <TextSmall>
      {transitModeToEmoji[estimate.mode]} {secondsToString(estimate.seconds)}
    </TextSmall>
  );
}

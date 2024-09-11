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
import { useEstimateHover, useTripState } from './TripState';
import { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';

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
              {index < stops.length - 1 ? null : (
                <RemoveStopButton
                  removeStop={() => {
                    removeStop({ stopId: stop._id });
                  }}
                />
              )}
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
  const { estimate: estimateHovered } = useEstimateHover();
  const estimateKey = `${stopIdFirst}--${stopIdSecond}` as const;
  const estimateDoc = estimatesByStops.get(estimateKey) ?? 'uninitialized';
  if (estimateDoc == 'uninitialized') {
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

  const estimate = estimateDoc.estimate;
  if (estimate == null || estimate.type === 'list') {
    return (
      <EstimateList
        className="flex gap-2"
        initTransitTimeEstimate={() =>
          initTransitTimeEstimate({
            stopIdFirst: stopIdFirst,
            stopIdSecond: stopIdSecond,
          })
        }
        selectTransitTimeEstimateMode={(s: 'transit' | 'walk' | 'bicycle') =>
          selectTransitTimeEstimateMode({
            stopIdFirst: stopIdFirst,
            stopIdSecond: stopIdSecond,
            mode: s,
          })
        }
        estimate={estimate ?? 'loading'}
        hoveredMode={
          estimateHovered?.id === estimateDoc._id ? estimateHovered.mode : null
        }
      />
    );
  }

  return (
    <TextSmall>
      {transitModeToEmoji[estimate.mode]} {secondsToString(estimate.seconds)}
    </TextSmall>
  );
}

function EstimateList({
  estimate,
  ...props
}: {
  className?: string;

  initTransitTimeEstimate: () => void;
  selectTransitTimeEstimateMode: (s: 'transit' | 'walk' | 'bicycle') => void;
  estimate:
    | {
        walkSeconds: number | null;
        bicycleSeconds: number | null;
        transitSeconds: number | null;
      }
    | 'loading';
  hoveredMode: 'transit' | 'walk' | 'bicycle' | null;
}) {
  const orIsLoading = (mode: 'walk' | 'transit' | 'bicycle') => {
    if (estimate === 'loading') {
      return <ReloadIcon className="ml-2 h-3 w-3 animate-spin" />;
    }
    const s = secondsToString(estimate[`${mode}Seconds`]);
    return <TextSmall>{s}</TextSmall>;
  };
  return (
    <div className={cn('flex w-full', props.className)}>
      {(['walk', 'transit', 'bicycle'] as const).map((mode) => (
        <Button
          key={mode}
          variant="outline"
          size="sm"
          onClick={() => props.selectTransitTimeEstimateMode(mode)}
          disabled={estimate === 'loading'}
          className={cn(
            'flex-1 w-0',
            props.hoveredMode === mode && 'bg-accent',
          )}
        >
          {transitModeToEmoji[mode]}{' '}
          <span className="ml-1">{orIsLoading(mode)}</span>
        </Button>
      ))}
      <Button
        key="refresh"
        variant="outline"
        size="sm"
        onClick={() => props.initTransitTimeEstimate()}
        disabled={estimate === 'loading'}
      >
        <ReloadIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

function RemoveStopButton({ removeStop }: { removeStop: () => void }) {
  return (
    <Button
      onClick={() => {
        removeStop();
      }}
      variant="outline"
      size="sm"
      className="p-1 h-auto"
    >
      <Cross2Icon className="h-3 w-3" />
    </Button>
  );
}

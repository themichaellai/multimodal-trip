'use client';

import {
  ComponentProps,
  Fragment,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  CheckIcon,
  Cross2Icon,
  DotIcon,
  DotsVerticalIcon,
  ReloadIcon,
  Pencil1Icon,
} from '@radix-ui/react-icons';

import { TextSmall, TextLarge } from '@/components/typography';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useEstimateHover,
  useTripState,
  useTripStatePreloaded,
} from './TripState';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import {
  type PreloadedTripSteps,
  type PreloadedTrip,
} from './trip-state-server';

export default function Sidebar({
  tripSlug,
  trip,
  estimateSteps,
}: {
  tripSlug: string;
  trip: Promise<PreloadedTrip>;
  estimateSteps: Promise<PreloadedTripSteps>;
}) {
  const { stops, removeStop, editStopName, estimatesByStops } =
    useTripStatePreloaded(tripSlug, use(trip), use(estimateSteps));
  const [editedStop, setEditedStop] = useState<Id<'stops'> | null>(null);
  return (
    <>
      <TextLarge className="mb-1">Stops</TextLarge>
      <div>
        {stops.map((stop, index) => (
          <Fragment key={stop._id}>
            <div className="flex items-center gap-2 py-3 h-9">
              <DotIcon className="h-5 w-5 text-muted-foreground" />
              {editedStop === stop._id ? (
                <StopEdit
                  placeholder={stop.name}
                  cancelEdit={() => {
                    setEditedStop(null);
                  }}
                  saveEdit={(newName) => {
                    editStopName({ stopId: stop._id, name: newName });
                    setEditedStop(null);
                  }}
                />
              ) : (
                <>
                  <TextSmall className="font-semibold">
                    {stop.name ?? 'Place'}
                  </TextSmall>
                  <EditStopNameButton
                    toggleEdit={() => {
                      setEditedStop((s) => (s === stop._id ? null : stop._id));
                    }}
                  />
                  {index < stops.length - 1 ? null : (
                    <RemoveStopButton
                      removeStop={() => {
                        removeStop({ stopId: stop._id });
                      }}
                    />
                  )}
                </>
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
                  estimateDoc={
                    estimatesByStops.get(
                      `${stop._id}--${stops[index + 1]._id}`,
                    ) ?? null
                  }
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
  estimateDoc,
}: {
  estimateDoc: Doc<'transitTimes'> | null;
  stopIdFirst: Id<'stops'>;
  stopIdSecond: Id<'stops'>;
  tripSlug: string;
}) {
  const { initTransitTimeEstimate, selectTransitTimeEstimateMode } =
    useTripState(tripSlug);
  const { estimate: estimateHovered, setEstimate: setEstimateHovered } =
    useEstimateHover();
  if (estimateDoc == null) {
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
        setHoveredMode={(mode) => {
          setEstimateHovered(
            mode == null
              ? null
              : {
                  mode: mode,
                  id: estimateDoc._id,
                },
          );
        }}
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
  setHoveredMode: (mode: 'transit' | 'walk' | 'bicycle' | null) => void;
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
          onMouseOver={() => {
            props.setHoveredMode(mode);
          }}
          onMouseOut={() => {
            props.setHoveredMode(null);
          }}
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

function EditStopNameButton({ toggleEdit }: { toggleEdit: () => void }) {
  return (
    <ActionButton
      onClick={() => {
        toggleEdit();
      }}
    >
      <Pencil1Icon className="h-3 w-3" />
    </ActionButton>
  );
}
function RemoveStopButton({ removeStop }: { removeStop: () => void }) {
  return (
    <ActionButton
      onClick={() => {
        removeStop();
      }}
    >
      <Cross2Icon className="h-3 w-3" />
    </ActionButton>
  );
}

function ActionButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="sm" className="p-1 h-auto" {...props} />
  );
}

function StopEdit({
  placeholder,
  cancelEdit,
  saveEdit,
}: {
  placeholder: string | null;
  cancelEdit: () => void;
  saveEdit: (newName: string) => void;
}) {
  const [val, setVal] = useState(placeholder ?? '');
  const submit = () => {
    saveEdit(val);
  };
  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [cancelEdit],
  );
  useEffect(() => {
    document.addEventListener('keydown', onEscape, true);
    return () => {
      document.removeEventListener('keydown', onEscape, true);
    };
  }, [onEscape]);
  return (
    <>
      <Input
        className="w-auto"
        value={val}
        placeholder={placeholder ?? undefined}
        onChange={(e) => {
          setVal(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            submit();
          }
          if (e.key === 'Escape') {
            console.log('esc pressed', e.isDefaultPrevented);
            cancelEdit();
          }
        }}
        autoFocus
        onSubmit={submit}
      />
      <Button variant="outline" className="px-2 py-1" onClick={submit}>
        <CheckIcon />
      </Button>
      <Button
        variant="outline"
        className="px-2 py-1"
        onClick={() => cancelEdit()}
      >
        <Cross2Icon />
      </Button>
    </>
  );
}

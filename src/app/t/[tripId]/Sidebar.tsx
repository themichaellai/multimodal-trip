'use client';

import {
  ComponentProps,
  Fragment,
  PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  ...props
}: {
  tripSlug: string;
  trip: Promise<PreloadedTrip>;
  estimateSteps: Promise<PreloadedTripSteps>;
}) {
  const {
    stops,
    removeStop,
    editStopName,
    estimatesByStops,
    estimateSteps,
    isOwner,
  } = useTripStatePreloaded(
    tripSlug,
    use(props.trip),
    use(props.estimateSteps),
  );
  const [editedStop, setEditedStop] = useState<Id<'stops'> | null>(null);
  const estimateStepsByStopPairs = useMemo(() => {
    if (estimateSteps == null) {
      return null;
    }
    return new Map(
      estimateSteps.map(
        (s) =>
          [
            `${s.stopIdFirst}--${s.stopIdSecond}` as const,
            s.tripSteps,
          ] as const,
      ),
    );
  }, [estimateSteps]);
  return (
    <>
      <TextLarge className="mb-1">Stops</TextLarge>
      <div className="flex flex-col items-stretch">
        {stops.map((stop, index) => (
          <Fragment key={stop._id}>
            <div className="flex items-center gap-2 py-3 h-9">
              <DotIcon className="h-5 w-5 text-muted-foreground" />
              <StopEditable
                stopName={stop.name ?? 'Place'}
                editEnabled={isOwner}
                isEditing={editedStop === stop._id}
                toggleEdit={() => {
                  setEditedStop((s) => (s === stop._id ? null : stop._id));
                }}
                removeStop={
                  index < stops.length - 1 || !isOwner
                    ? null
                    : () => {
                        removeStop({ stopId: stop._id });
                      }
                }
                saveEdit={(newName) => {
                  editStopName({ stopId: stop._id, name: newName });
                  setEditedStop(null);
                }}
              />
            </div>

            {index >= stops.length - 1 ? null : (
              <div
                key={stop._id + 'foo'}
                className="flex items-center gap-2 py-3"
              >
                <DotsVerticalIcon className="h-5 w-5 text-muted-foreground" />
                <TransitTimeEstimate
                  editable={isOwner}
                  stopIdFirst={stop._id}
                  stopIdSecond={stops[index + 1]._id}
                  tripSlug={tripSlug}
                  estimateDoc={
                    estimatesByStops.get(
                      `${stop._id}--${stops[index + 1]._id}`,
                    ) ?? null
                  }
                  estimateSteps={
                    estimateStepsByStopPairs?.get(
                      `${stop._id}--${stops[index + 1]._id}`,
                    ) ?? []
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
  unknown: <>&#10067;</>, // question mark
} as const;

/** Displays a transit time estimate list or a selection of a single mode. */
function TransitTimeEstimate({
  stopIdFirst,
  stopIdSecond,
  tripSlug,
  estimateDoc,
  estimateSteps,
  editable,
}: {
  estimateDoc: Doc<'transitTimes'> | null;
  stopIdFirst: Id<'stops'>;
  stopIdSecond: Id<'stops'>;
  tripSlug: string;
  estimateSteps: Doc<'tripSteps'>[];
  editable: boolean;
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
        estimateSteps={estimateSteps}
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
        editable={editable}
      />
    );
  }

  return (
    <StepPopover
      steps={estimateSteps.filter((s) => s.tripMode === estimate.mode)}
      cursorDefault
    >
      <TextSmall>
        {transitModeToEmoji[estimate.mode]} {secondsToString(estimate.seconds)}
      </TextSmall>
    </StepPopover>
  );
}

const groupTripStepsByTripMode = (steps: Array<Doc<'tripSteps'>>) => {
  const grouped = new Map<
    'transit' | 'walk' | 'bicycle',
    Array<Doc<'tripSteps'>>
  >();
  for (const step of steps) {
    if (!grouped.has(step.tripMode)) {
      grouped.set(step.tripMode, []);
    }
    grouped.get(step.tripMode)?.push(step);
  }
  return grouped;
};

function EstimateList({
  estimate,
  estimateSteps,
  editable,
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
  estimateSteps: Array<Doc<'tripSteps'>>;
  editable: boolean;
}) {
  const orIsLoading = (mode: 'walk' | 'transit' | 'bicycle') => {
    if (estimate === 'loading') {
      return <ReloadIcon className="ml-2 h-3 w-3 animate-spin" />;
    }
    const s = secondsToString(estimate[`${mode}Seconds`]);
    return <TextSmall>{s}</TextSmall>;
  };
  const groupedSteps = useMemo(
    () => groupTripStepsByTripMode(estimateSteps),
    [estimateSteps],
  );
  return (
    <div className={cn('flex w-full', props.className)}>
      {(['walk', 'transit', 'bicycle'] as const).map((mode) => (
        <StepPopover key={mode} asChild steps={groupedSteps.get(mode) ?? []}>
          <Button
            onMouseOver={() => {
              props.setHoveredMode(mode);
            }}
            onMouseOut={() => {
              props.setHoveredMode(null);
            }}
            variant="outline"
            size="sm"
            onClick={
              !editable
                ? undefined
                : () => props.selectTransitTimeEstimateMode(mode)
            }
            disabled={estimate === 'loading'}
            className={cn(
              'flex-1 w-0',
              editable ? null : 'cursor-default',
              props.hoveredMode === mode && 'bg-accent',
            )}
          >
            {transitModeToEmoji[mode]}{' '}
            <span className="ml-1">{orIsLoading(mode)}</span>
          </Button>
        </StepPopover>
      ))}
      {!editable ? null : (
        <Button
          key="refresh"
          variant="outline"
          size="sm"
          onClick={() => props.initTransitTimeEstimate()}
          disabled={estimate === 'loading'}
        >
          <ReloadIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/** Generates a estimate summary of steps suitable for tooltip. */
const stepsSummary = (
  steps: Array<Doc<'tripSteps'>>,
): Array<{
  mode: Doc<'tripSteps'>['stepMode'];
  durationSeconds: number;
}> => {
  const stepsSorted = steps.sort((a, b) => a.stepIndex - b.stepIndex);
  const res: Array<{
    mode: Doc<'tripSteps'>['stepMode'];
    durationSeconds: number;
  }> = [];
  for (const step of stepsSorted) {
    const last = res.at(-1);
    if (last != null && last.mode === step.stepMode) {
      last.durationSeconds += step.seconds;
    } else {
      res.push({
        mode: step.stepMode,
        durationSeconds: step.seconds,
      });
    }
  }
  return res;
};

function StepPopover({
  steps,
  children,
  asChild,
  cursorDefault,
}: PropsWithChildren<{
  steps: Array<Doc<'tripSteps'>>;
  asChild?: boolean;
  cursorDefault?: boolean;
}>) {
  return (
    <Tooltip>
      <TooltipTrigger
        asChild={asChild}
        className={cn(cursorDefault ? 'cursor-default' : null)}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <StepPopoverContent steps={steps} />
      </TooltipContent>
    </Tooltip>
  );
}
function StepPopoverContent({ steps }: { steps: Array<Doc<'tripSteps'>> }) {
  const summary = stepsSummary(steps);
  return (
    <div className="flex flex-col gap-2">
      {summary.map((s, i) => (
        <div key={i}>
          <TextSmall>
            {transitModeToEmoji[s.mode]} {secondsToString(s.durationSeconds)}
          </TextSmall>
        </div>
      ))}
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

function StopEditable({
  stopName,
  editEnabled,
  isEditing,
  toggleEdit,
  removeStop,
  saveEdit,
}: {
  stopName: string;
  editEnabled: boolean;
  isEditing: boolean;
  toggleEdit: () => void;
  removeStop: (() => void) | null;
  saveEdit: (newName: string) => void;
}) {
  return isEditing ? (
    <StopEdit
      placeholder={stopName}
      cancelEdit={toggleEdit}
      saveEdit={(newName) => {
        saveEdit(newName);
      }}
    />
  ) : (
    <StopDisplay
      stopName={stopName}
      editEnabled={editEnabled}
      toggleEdit={() => {
        toggleEdit();
      }}
      removeStop={removeStop}
    />
  );
}
function StopDisplay({
  stopName,
  editEnabled,
  toggleEdit,
  removeStop,
}: {
  stopName: string;
  editEnabled: boolean;
  toggleEdit: () => void;
  removeStop: (() => void) | null;
}) {
  return (
    <>
      <TextSmall className="font-semibold">{stopName}</TextSmall>
      {!editEnabled ? null : (
        <EditStopNameButton
          toggleEdit={() => {
            toggleEdit();
          }}
        />
      )}
      {removeStop == null ? null : (
        <RemoveStopButton
          removeStop={() => {
            removeStop();
          }}
        />
      )}
    </>
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
        className="flex-1"
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

'use client';

import { use, useCallback, useEffect, useState, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PreloadedTrip, PreloadedTripSteps } from './trip-state-server';
import { useTripStatePreloaded } from './TripState';

export function TripHeader(props: {
  tripSlug: string;
  trip: Promise<PreloadedTrip>;
  estimateSteps: Promise<PreloadedTripSteps>;
}) {
  const { trip, editTripName, isOwner } = useTripStatePreloaded(
    props.tripSlug,
    use(props.trip),
    use(props.estimateSteps),
  );

  const handleSubmit = useCallback(
    (newName: string) => {
      if (trip?._id == null) {
        return;
      }
      editTripName({ tripId: trip._id, name: newName });
    },
    [editTripName, trip?._id],
  );

  return (
    <EditableHeader
      value={trip?.name ?? 'My trip'}
      onSubmit={handleSubmit}
      editable={isOwner}
    />
  );
}

function EditableHeader({
  onSubmit,
  ...props
}: {
  value: string;
  onSubmit: (value: string) => void;
  editable: boolean;
}) {
  const [editingState, setEditingState] = useState<{ value: string } | null>(
    null,
  );

  const handleSubmit = useCallback(
    (newVal: string) => {
      onSubmit(newVal);
      setEditingState(null);
    },
    [onSubmit],
  );

  const cancelEdit = useCallback(() => {
    setEditingState(null);
  }, []);

  return editingState == null ? (
    <h1
      className={cn(
        !props.editable
          ? null
          : 'hover:-translate-x-3 hover:px-3 hover:border-input cursor-pointer',
        'text-2xl font-bold rounded-md py-1 border border-transparent transition-colors',
      )}
      onClick={() => {
        if (props.editable) {
          setEditingState({ value: props.value });
        }
      }}
    >
      {props.value}
    </h1>
  ) : (
    <InputWithKeys
      className="-translate-x-3"
      value={editingState.value}
      onChange={(e) => {
        setEditingState({ value: e.target.value });
      }}
      cancelEdit={cancelEdit}
      onSubmit={handleSubmit}
    />
  );
}

function InputWithKeys({
  cancelEdit,
  value,
  onChange,
  onSubmit,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cancelEdit: () => void;
  onSubmit: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSubmit(value);
      }
    },
    [onSubmit, value],
  );

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [cancelEdit],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        cancelEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onEscape, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onEscape, true);
    };
  }, [onEscape, cancelEdit]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus
      className={cn('text-2xl font-bold h-auto py-1', className)}
    />
  );
}

'use client';

import { use, useCallback, useEffect, useState, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { PreloadedTrip, PreloadedTripSteps } from './trip-state-server';
import { useTripStatePreloaded } from './TripState';

export function TripHeader(props: {
  tripSlug: string;
  trip: Promise<PreloadedTrip>;
  estimateSteps: Promise<PreloadedTripSteps>;
}) {
  const { trip, editTripName } = useTripStatePreloaded(
    props.tripSlug,
    use(props.trip),
    use(props.estimateSteps),
  );
  const [editingState, setEditingState] = useState<{ name: string } | null>(
    null,
  );

  const handleSubmit = useCallback(
    (newName: string) => {
      if (trip?._id == null) {
        return;
      }
      editTripName({ tripId: trip._id, name: newName });
      setEditingState(null);
    },
    [editTripName, trip?._id],
  );

  const cancelEdit = useCallback(() => {
    setEditingState(null);
  }, []);
  return editingState == null ? (
    <h1
      className="text-2xl font-bold rounded-md hover:px-3 py-1 border border-transparent hover:border-input cursor-pointer transition-colors"
      onClick={() => {
        setEditingState({ name: trip?.name ?? '' });
      }}
    >
      {trip?.name ?? 'My trip'}
    </h1>
  ) : (
    <InputWithKeys
      value={editingState.name}
      onChange={(e) => {
        setEditingState({ name: e.target.value });
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
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cancelEdit: () => void;
  onSubmit: (value: string) => void;
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
      className="text-2xl font-bold h-auto py-1"
    />
  );
}

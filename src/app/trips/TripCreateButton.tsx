'use client';

import { useMutation } from 'convex/react';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';

export function TripCreateButton() {
  const addStop = useMutation(api.trips.createTrip);
  const router = useRouter();
  const createAndNavigate = async () => {
    const trip = await addStop();
    router.push(`/t/${trip.slug}`);
  };
  return (
    <Button size="sm" variant="secondary" onClick={createAndNavigate}>
      <PlusIcon className="mr-1" /> New
    </Button>
  );
}

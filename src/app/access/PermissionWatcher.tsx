'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

import { api } from '../../../convex/_generated/api';

export function PermissionWatcher() {
  const router = useRouter();
  const hasAccess = useQuery(api.users.getUserAccess);
  useEffect(() => {
    if (hasAccess?.hasAccess) {
      router.push('/trips');
    }
  }, [hasAccess?.hasAccess, router]);
  return null;
}

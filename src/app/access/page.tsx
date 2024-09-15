import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { api } from '../../../convex/_generated/api';
import { PermissionWatcher } from './PermissionWatcher';

export default async function Page() {
  const { hasAccess } = await fetchQuery(
    api.users.getUserAccess,
    {},
    {
      token: convexAuthNextjsToken(),
    },
  );
  if (hasAccess) {
    return redirect('/trips');
  }

  return (
    <>
      <PermissionWatcher />
      <div className="flex h-screen justify-center items-center pt-4 pb-4">
        <Card className="w-[24rem] m-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Contact for access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p>
              Please contact{' '}
              <a href="mailto:themichaellai@gmail.com">
                themichaellai@gmail.com
              </a>{' '}
              for access.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

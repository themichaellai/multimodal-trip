import 'server-only';

import { init, tx } from '@instantdb/admin';
import { Schema } from './db';

const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_DB_ID ?? '';
const INSTANT_DB_SECRET = process.env.INSTANT_DB_SECRET ?? '';

const db = init<Schema>({
  appId: INSTANT_APP_ID,
  adminToken: INSTANT_DB_SECRET,
});

export async function setStopName(stopId: string, name: string): Promise<void> {
  await db.transact([tx.stops[stopId].update({ name })]);
}

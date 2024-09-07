import { redirect } from 'next/navigation';
import { customAlphabet } from 'nanoid';

// "nolookalikes" from nanoid-dictionary
const nanoid = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',
  14,
);

export async function GET() {
  return redirect(`/${nanoid()}`);
}

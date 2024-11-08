import type { Metadata } from 'next';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';

import './globals.css';
import { ConvexClientProvider } from '../components/ConvexClientProvider';

export const metadata: Metadata = {
  title: 'MTP',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body className="antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

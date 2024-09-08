import type { Metadata } from 'next';
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
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

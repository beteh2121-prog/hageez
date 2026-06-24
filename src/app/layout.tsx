import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Ethiopian Orthodox Heritage',
    default: 'Ethiopian Orthodox Heritage',
  },
  description: 'Ethiopian Orthodox faith, culture, and crafts.',
  openGraph: {
    type: 'website',
    siteName: 'Ethiopian Orthodox Heritage',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-cream font-sans text-charcoal">
        <QueryProvider>
          <Toaster position="top-right" richColors />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

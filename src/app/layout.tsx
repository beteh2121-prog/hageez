import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Serif_Ethiopic } from 'next/font/google';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import CurrencyProvider from '@/providers/CurrencyProvider';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '600', '700'],
  variable: '--font-ethiopic',
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
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${notoSerifEthiopic.variable}`}>
      <body className="bg-cream font-sans text-charcoal">
        <QueryProvider>
          <CurrencyProvider>
            <Toaster position="top-right" richColors />
            {children}
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

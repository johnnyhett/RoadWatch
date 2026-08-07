import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { LocationProvider } from '@/context/LocationContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import AppShell from '@/components/layout/AppShell';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'RoadWatch — Traffic Accident Pattern Recognition System',
  description: 'Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased h-screen overflow-hidden flex flex-col transition-colors duration-300`}>
        <UserPreferencesProvider>
          <LocationProvider>
            <Navbar />
            <main className="flex-1 relative overflow-hidden">
              <AppShell>{children}</AppShell>
            </main>
          </LocationProvider>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '../components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Cards Against Humanity | Online Real-Time Multiplayer',
  description: 'A sleek, real-time multiplayer web game of Cards Against Humanity. Create private rooms, play with friends, custom decks, and rotating Card Czar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-neutral-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

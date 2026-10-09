import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExamPulseCore',
  description: 'A student exam planning dashboard for countdowns and study prep.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

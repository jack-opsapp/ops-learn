import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://learn.opsapp.co'),
  title: {
    default: 'OPS Learn — Free Courses for Service Business Owners',
    template: '%s | OPS Learn',
  },
  description:
    'Free and premium courses to help you start, run, and scale your service business. Built by OPS.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://learn.opsapp.co',
    siteName: 'OPS Learn',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

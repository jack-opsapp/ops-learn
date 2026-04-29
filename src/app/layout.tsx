import type { Metadata } from 'next';
import './globals.css';
import SessionSync from '@/components/SessionSync';

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
  // Color-scheme-aware SVG favicons. app/apple-icon.png + app/favicon.ico
  // auto-convention files remain as raster fallbacks.
  icons: {
    icon: [
      { url: '/brand/icon-light.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
      { url: '/brand/icon-dark.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SessionSync />
        {children}

        {/* Ambient page-edge glows — accent at low alpha only */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute"
            style={{
              left: '-200px',
              top: '15%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(111, 148, 176, 0.04) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute"
            style={{
              right: '-220px',
              top: '80%',
              width: '550px',
              height: '550px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(111, 148, 176, 0.035) 0%, transparent 70%)',
            }}
          />
        </div>
      </body>
    </html>
  );
}

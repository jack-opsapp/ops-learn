import Link from 'next/link';

const columns = [
  {
    title: 'LEARN',
    links: [
      { label: 'ALL COURSES', href: '/' },
      { label: 'FREE COURSES', href: '/#free' },
      { label: 'PREMIUM', href: '/#premium' },
    ],
  },
  {
    title: 'OPS',
    links: [
      { label: 'PLATFORM', href: 'https://opsapp.co/platform', external: true },
      { label: 'PLANS', href: 'https://opsapp.co/plans', external: true },
      { label: 'WEB APP', href: 'https://app.opsapp.co', external: true },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'ABOUT', href: 'https://opsapp.co/company', external: true },
      { label: 'JOURNAL', href: 'https://opsapp.co/journal', external: true },
      { label: 'CONTACT', href: 'https://opsapp.co/resources#contact', external: true },
    ],
  },
  {
    title: 'CONNECT',
    links: [
      { label: 'APP STORE', href: 'https://apps.apple.com/app/ops-app/id6504890498', external: true },
      { label: 'INSTAGRAM', href: 'https://instagram.com/ops.app.co', external: true },
      { label: 'LINKEDIN', href: 'https://linkedin.com/company/ops-app', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative">
      <div className="h-px bg-ops-border" />

      <div className="mx-auto max-w-[1400px] px-6 pt-16 pb-12 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-5 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
                {`// ${column.title}`}
              </h3>
              <ul className="space-y-1">
                {column.links.map((link) => {
                  const isExternal = 'external' in link && link.external;
                  const className =
                    'inline-flex min-h-[44px] items-center font-display text-[13px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary';
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-ops-border pt-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="font-display text-[14px] font-light tracking-wider text-ops-text-tertiary">
              OPS
            </span>
            <span className="font-mono text-[11px] text-ops-text-tertiary">
              {`© ${new Date().getFullYear()} OPS TECHNOLOGIES INC.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://opsapp.co/legal?page=privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center px-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
            >
              PRIVACY
            </a>
            <a
              href="https://opsapp.co/legal?page=terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center px-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
            >
              TERMS
            </a>
          </div>
        </div>
      </div>

      {/* Horizon glow — accent at low alpha only */}
      <div className="relative h-40 w-full overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 120% at 50% 100%, rgba(111, 148, 176, 0.10) 0%, rgba(111, 148, 176, 0.04) 25%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 40% 60% at 50% 100%, rgba(111, 148, 176, 0.14) 0%, transparent 70%)',
          }}
        />
      </div>
    </footer>
  );
}

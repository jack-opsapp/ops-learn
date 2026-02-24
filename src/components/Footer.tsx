import Link from 'next/link';

const columns = [
  {
    title: 'LEARN',
    links: [
      { label: 'All Courses', href: '/' },
      { label: 'Free Courses', href: '/#free' },
      { label: 'Premium', href: '/#premium' },
    ],
  },
  {
    title: 'OPS',
    links: [
      { label: 'Platform', href: 'https://opsapp.co/platform', external: true },
      { label: 'Plans', href: 'https://opsapp.co/plans', external: true },
      { label: 'Web App', href: 'https://app.opsapp.co', external: true },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', href: 'https://opsapp.co/company', external: true },
      { label: 'Journal', href: 'https://opsapp.co/journal', external: true },
      { label: 'Contact', href: 'https://opsapp.co/resources#contact', external: true },
    ],
  },
  {
    title: 'CONNECT',
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/app/ops-app/id6504890498', external: true },
      { label: 'Instagram', href: 'https://instagram.com/ops.app.co', external: true },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/ops-app', external: true },
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
              <h3 className="mb-5 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => {
                  const isExternal = 'external' in link && link.external;
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-sm text-ops-text-secondary transition-colors hover:text-ops-text-primary"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="font-body text-sm text-ops-text-secondary transition-colors hover:text-ops-text-primary"
                        >
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
            <span className="font-heading text-sm font-bold tracking-wide text-ops-text-primary opacity-50">
              OPS
            </span>
            <span className="font-body text-xs text-ops-text-secondary">
              &copy; {new Date().getFullYear()} OPS Technologies Inc.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://opsapp.co/legal?page=privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
            >
              Privacy
            </a>
            <a
              href="https://opsapp.co/legal?page=terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
            >
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Solar horizon glow — matches ops-site */}
      <div className="relative h-40 w-full overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 120% at 50% 100%, rgba(89, 119, 148, 0.15) 0%, rgba(89, 119, 148, 0.06) 25%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(212, 98, 43, 0.10) 0%, rgba(212, 98, 43, 0.04) 30%, transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 40% 60% at 50% 100%, rgba(89, 119, 148, 0.20) 0%, rgba(212, 98, 43, 0.08) 40%, transparent 70%)',
          }}
        />
      </div>
    </footer>
  );
}

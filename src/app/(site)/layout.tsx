export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}

      {/* Ambient page-edge glows — matches ops-site PageLayout */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute"
          style={{
            left: '-200px',
            top: '15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(89, 119, 148, 0.05) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute"
          style={{
            right: '-200px',
            top: '40%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 98, 43, 0.035) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: '-180px',
            top: '65%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 98, 43, 0.03) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(89, 119, 148, 0.045) 0%, transparent 70%)',
          }}
        />
      </div>
    </>
  );
}

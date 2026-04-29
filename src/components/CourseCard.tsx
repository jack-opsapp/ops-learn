import Link from 'next/link';

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  estimatedDuration?: number;
  moduleCount: number;
  lessonCount: number;
  isFree: boolean;
  priceCents: number;
}

export default function CourseCard({
  slug,
  title,
  description,
  thumbnailUrl,
  estimatedDuration,
  moduleCount,
  lessonCount,
  isFree,
  priceCents,
}: CourseCardProps) {
  return (
    <Link
      href={`/courses/${slug}`}
      className="glass-surface group flex flex-col transition-colors duration-150 hover:border-ops-border-hover overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[rgba(255,255,255,0.04)]">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-[48px] font-light tracking-wider text-white/[0.06]" aria-hidden="true">
              OPS
            </span>
          </div>
        )}

        {/* Feathered bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(18,18,20,0.95), transparent)',
          }}
        />

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {isFree ? (
            <span
              className="rounded-[4px] px-2 py-[2px] font-mono text-[11px] uppercase tracking-wider"
              style={{
                color: '#9DB582',
                background: 'rgba(157,181,130,0.12)',
                border: '1px solid rgba(157,181,130,0.30)',
              }}
            >
              FREE
            </span>
          ) : (
            <span className="rounded-[4px] bg-[rgba(18,18,20,0.78)] px-2 py-[2px] font-mono text-[11px] text-ops-text-primary backdrop-blur-sm border border-[rgba(255,255,255,0.10)]">
              ${(priceCents / 100).toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-medium text-ops-text-primary">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-ops-text-secondary">
          {description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
          <span>{moduleCount} MODULES</span>
          <span className="text-ops-text-mute" aria-hidden="true">·</span>
          <span>{lessonCount} LESSONS</span>
          {estimatedDuration && (
            <>
              <span className="text-ops-text-mute" aria-hidden="true">·</span>
              <span>{estimatedDuration} MIN</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

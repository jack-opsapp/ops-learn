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
      className="group flex flex-col bg-ops-surface border border-ops-border rounded-[3px] transition-[border-color] duration-300 hover:border-ops-border-hover overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-ops-surface-elevated">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-heading text-4xl font-bold text-white/[0.06]">
              OPS
            </span>
          </div>
        )}

        {/* Feathered bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background: 'linear-gradient(to top, #0D0D0D, transparent)',
          }}
        />

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {isFree ? (
            <span className="rounded-[3px] bg-ops-accent/90 px-2.5 py-1 font-caption text-[10px] uppercase tracking-[0.1em] text-white">
              Free
            </span>
          ) : (
            <span className="rounded-[3px] bg-ops-surface/80 px-2.5 py-1 font-caption text-[10px] text-ops-text-primary backdrop-blur-sm border border-ops-border">
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
        <p className="mt-2 line-clamp-2 font-body text-sm font-light leading-relaxed text-ops-text-secondary">
          {description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-3 pt-4 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
          <span>{moduleCount} modules</span>
          <span className="text-ops-border">|</span>
          <span>{lessonCount} lessons</span>
          {estimatedDuration && (
            <>
              <span className="text-ops-border">|</span>
              <span>{estimatedDuration} min</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

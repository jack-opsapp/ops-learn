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
      className="group flex flex-col overflow-hidden rounded-ops-xl border border-ops-border bg-ops-surface transition-all hover:border-ops-border-hover hover:bg-ops-surface-elevated"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-ops-surface-elevated">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-heading text-4xl font-bold text-ops-accent/20">
              OPS
            </span>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {isFree ? (
            <span className="rounded-ops-lg bg-ops-success/90 px-2.5 py-1 font-caption text-xs font-medium text-ops-background">
              FREE
            </span>
          ) : (
            <span className="rounded-ops-lg bg-ops-surface/90 px-2.5 py-1 font-caption text-xs text-ops-text-primary backdrop-blur-sm">
              ${(priceCents / 100).toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-heading text-lg font-semibold leading-tight text-ops-text-primary">
          {title}
        </h3>
        <p className="line-clamp-2 font-body text-sm leading-relaxed text-ops-text-secondary">
          {description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-4 pt-3 font-caption text-xs text-ops-text-tertiary">
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

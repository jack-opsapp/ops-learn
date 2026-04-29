'use client';

import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import InteractiveTool from './InteractiveTool';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sort_order: number;
}

interface NavItem {
  slug: string;
  title: string;
  href?: string; // explicit href; falls back to lesson route
}

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    slug: string;
    duration_minutes: number | null;
    content_blocks?: ContentBlock[];
  };
  moduleName: string;
  courseSlug: string;
  prevLesson: NavItem | null;
  nextLesson: NavItem | null;
  userId?: string;
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol',
      'li', 'blockquote', 'code', 'pre', 'img', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
  });
}

function ContentBlockRenderer({ block, userId }: { block: ContentBlock; userId?: string }) {
  const content = block.content as Record<string, string>;

  switch (block.type) {
    case 'video':
      return (
        <div className="glass-surface aspect-video w-full overflow-hidden">
          {content.url ? (
            <video
              src={content.url}
              controls
              className="h-full w-full"
              poster={content.poster ?? undefined}
            />
          ) : content.embed_html ? (
            <div
              className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(content.embed_html, {
                  ALLOWED_TAGS: ['iframe'],
                  ALLOWED_ATTR: [
                    'src', 'width', 'height', 'frameborder',
                    'allow', 'allowfullscreen', 'title',
                  ],
                }),
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
                Video coming soon
              </span>
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="prose-ops max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(content.html ?? ''),
            }}
          />
        </div>
      );

    case 'download':
      return (
        <a
          href={content.url}
          download
          className="glass-surface group flex items-center gap-4 p-5 transition-colors duration-150 hover:border-ops-border-hover"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[rgba(255,255,255,0.06)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-ops-text-secondary"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <p className="font-heading text-sm font-medium text-ops-text-primary">
              {content.title ?? 'Download'}
            </p>
            <p className="mt-0.5 font-body text-xs font-normal text-ops-text-secondary">
              {content.description ?? 'Click to download'}
            </p>
          </div>
        </a>
      );

    case 'action_item':
      return (
        <div className="glass-surface p-5" style={{ borderLeft: '2px solid #6F94B0' }}>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
            // ACTION ITEM
          </p>
          <p className="font-body text-sm leading-relaxed text-ops-text-primary">
            {content.text}
          </p>
        </div>
      );

    case 'quiz':
      return (
        <div className="glass-surface p-5">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ops-warning">
            // QUICK CHECK
          </p>
          <p className="font-body text-sm text-ops-text-primary">
            {content.question}
          </p>
        </div>
      );

    case 'interactive_tool': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <InteractiveTool config={block.content as any} />;
    }

    default:
      return null;
  }
}

export default function LessonPlayer({
  lesson,
  moduleName,
  courseSlug,
  prevLesson,
  nextLesson,
  userId,
}: LessonPlayerProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 lg:py-16">
        {/* Lesson header */}
        <div className="mb-10">
          <p className="font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
            {moduleName}
          </p>
          <h1
            className="mt-2 font-display font-light uppercase text-ops-text-primary"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            {lesson.title}
          </h1>
          {lesson.duration_minutes && (
            <p className="mt-2 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
              {lesson.duration_minutes} min
            </p>
          )}
        </div>

        {/* Content blocks */}
        <div className="flex flex-col gap-10">
          {lesson.content_blocks && lesson.content_blocks.length > 0 ? (
            lesson.content_blocks.map((block) => (
              <ContentBlockRenderer key={block.id} block={block} userId={userId} />
            ))
          ) : (
            <div className="glass-surface flex flex-col items-center justify-center py-20 text-center" style={{ borderStyle: 'dashed' }}>
              <span className="font-display text-3xl font-light tracking-wider text-white/[0.06]" aria-hidden="true">
                OPS
              </span>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                // CONTENT COMING SOON
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-16 flex items-center justify-between border-t border-ops-border pt-8">
          {prevLesson ? (
            <Link
              href={prevLesson.href ?? `/courses/${courseSlug}/lessons/${prevLesson.slug}`}
              className="group flex items-center gap-3 text-ops-text-secondary transition-colors hover:text-ops-text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 13L5 8L10 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-left">
                <p className="font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
                  Previous
                </p>
                <p className="font-body text-sm font-normal">{prevLesson.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={nextLesson.href ?? `/courses/${courseSlug}/lessons/${nextLesson.slug}`}
              className="group flex items-center gap-3 text-ops-text-secondary transition-colors hover:text-ops-text-primary"
            >
              <div className="text-right">
                <p className="font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
                  Next
                </p>
                <p className="font-body text-sm font-normal">{nextLesson.title}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <Link
              href={`/courses/${courseSlug}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-accent bg-transparent px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-accent transition-colors duration-150 hover:bg-ops-accent hover:text-ops-background"
            >
              COURSE COMPLETE
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline
                  points="9 11 12 14 22 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

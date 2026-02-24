'use client';

import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sort_order: number;
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
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
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

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  const content = block.content as Record<string, string>;

  switch (block.type) {
    case 'video':
      return (
        <div className="aspect-video w-full overflow-hidden rounded-ops-xl bg-ops-surface-elevated">
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
              <span className="font-caption text-sm text-ops-text-tertiary">
                Video coming soon
              </span>
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="prose prose-invert max-w-none font-body text-ops-text-secondary [&_h2]:font-heading [&_h2]:text-ops-text-primary [&_h3]:font-heading [&_h3]:text-ops-text-primary [&_strong]:text-ops-text-primary [&_a]:text-ops-accent">
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
          className="flex items-center gap-3 rounded-ops-xl border border-ops-border bg-ops-surface p-4 transition-colors hover:border-ops-accent hover:bg-ops-surface-elevated"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ops-lg bg-ops-accent/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-ops-accent"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-ops-text-primary">
              {content.title ?? 'Download'}
            </p>
            <p className="font-caption text-xs text-ops-text-tertiary">
              {content.description ?? 'Click to download'}
            </p>
          </div>
        </a>
      );

    case 'action_item':
      return (
        <div className="rounded-ops-xl border border-ops-accent/20 bg-ops-accent/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-ops-accent"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span className="font-caption text-xs font-medium uppercase tracking-wider text-ops-accent">
              Action Item
            </span>
          </div>
          <p className="font-body text-sm leading-relaxed text-ops-text-primary">
            {content.text}
          </p>
        </div>
      );

    case 'quiz':
      return (
        <div className="rounded-ops-xl border border-ops-border bg-ops-surface p-5">
          <span className="font-caption text-xs font-medium uppercase tracking-wider text-ops-warning">
            Quick Check
          </span>
          <p className="mt-2 font-body text-sm text-ops-text-primary">
            {content.question}
          </p>
        </div>
      );

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
}: LessonPlayerProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Lesson header */}
        <div className="mb-8">
          <p className="font-caption text-xs text-ops-text-tertiary">
            {moduleName}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ops-text-primary sm:text-3xl">
            {lesson.title}
          </h1>
          {lesson.duration_minutes && (
            <p className="mt-2 font-caption text-xs text-ops-text-tertiary">
              {lesson.duration_minutes} min
            </p>
          )}
        </div>

        {/* Content blocks */}
        <div className="flex flex-col gap-8">
          {lesson.content_blocks && lesson.content_blocks.length > 0 ? (
            lesson.content_blocks.map((block) => (
              <ContentBlockRenderer key={block.id} block={block} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-ops-xl border border-dashed border-ops-border py-16 text-center">
              <span className="font-heading text-3xl text-ops-accent/20">
                OPS
              </span>
              <p className="mt-3 font-caption text-sm text-ops-text-tertiary">
                Content coming soon
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-ops-border pt-6">
          {prevLesson ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${prevLesson.slug}`}
              className="group flex items-center gap-2 text-ops-text-secondary transition-colors hover:text-ops-accent"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 13L5 8L10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-left">
                <p className="font-caption text-[10px] text-ops-text-tertiary">
                  Previous
                </p>
                <p className="font-body text-sm">{prevLesson.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${nextLesson.slug}`}
              className="group flex items-center gap-2 text-ops-text-secondary transition-colors hover:text-ops-accent"
            >
              <div className="text-right">
                <p className="font-caption text-[10px] text-ops-text-tertiary">
                  Next
                </p>
                <p className="font-body text-sm">{nextLesson.title}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <Link
              href={`/courses/${courseSlug}`}
              className="flex items-center gap-2 rounded-ops-lg bg-ops-success/10 px-4 py-2 font-caption text-sm text-ops-success transition-colors hover:bg-ops-success/20"
            >
              Course Complete
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="9 11 12 14 22 4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

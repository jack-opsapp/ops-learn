import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChallengeForm from '@/components/ChallengeForm';
import ChallengeResults from '@/components/ChallengeResults';
import { getCourseWithModuleItems, getSessionUser } from '@/lib/supabase/queries';
import { getCourseChallenge, getChallengeAttempt } from '@/lib/supabase/challenge-queries';

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await getCourseWithModuleItems(slug);
  if (!course) notFound();

  // Must be a paid course
  if (course.price_cents === 0) redirect(`/courses/${slug}`);

  const challenge = await getCourseChallenge(course.id);
  if (!challenge) notFound();

  // Auth gate
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/auth/login?next=/courses/${slug}/challenge`);
  }

  // Check for existing attempt
  const attempt = await getChallengeAttempt(challenge.id, sessionUser.uid);

  // Strip correct_answer and rubric from questions before sending to client
  const clientQuestions = (challenge.questions as Array<Record<string, unknown>>).map((q) => {
    const cleaned = { ...q };
    delete cleaned.correct_answer;
    delete cleaned.rubric;
    return cleaned;
  });

  return (
    <>
      <Header />
      <main className="relative z-10">
        <section className="relative px-6 pt-28 pb-12 md:px-10 lg:px-24">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-ops-background to-ops-background" />

          <div className="relative mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <div className="flex items-center gap-2 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
                <Link href={`/courses/${slug}`} className="transition-colors hover:text-ops-text-primary">
                  {course.title}
                </Link>
                <span>/</span>
                <span className="text-ops-text-primary">Challenge</span>
              </div>
            </nav>

            {attempt && attempt.status === 'graded' ? (
              <ChallengeResults
                courseSlug={slug}
                courseId={course.id}
                courseTitle={course.title}
                priceCents={course.price_cents}
                score={attempt.score ?? 0}
                feedback={attempt.feedback as Array<{ questionId: string; score: number; maxPoints: number; feedback: string }>}
                questions={challenge.questions as Array<{ id: string; question: string; type: string; options?: string[] }>}
                discountPercentage={attempt.discount_percentage ?? 0}
                discountCode={attempt.discount_code ?? null}
              />
            ) : (
              <>
                <h1
                  className="font-heading font-bold uppercase text-ops-text-primary"
                  style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1.1 }}
                >
                  {challenge.title}
                </h1>
                {challenge.description && (
                  <p className="mt-4 font-body text-lg font-light leading-relaxed text-ops-text-secondary">
                    {challenge.description}
                  </p>
                )}
                <div className="mt-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary/60">
                  {clientQuestions.length} questions &middot; One attempt only
                </div>

                <div className="mt-10">
                  <ChallengeForm
                    challengeId={challenge.id}
                    questions={clientQuestions as Array<{ id: string; type: 'multiple_choice' | 'short_answer'; question: string; options: string[]; points: number }>}
                    courseSlug={slug}
                    courseId={course.id}
                    courseTitle={course.title}
                    priceCents={course.price_cents}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

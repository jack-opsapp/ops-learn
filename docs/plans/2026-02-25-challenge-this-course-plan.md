# Challenge This Course — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a free "Challenge This Course" quiz to paid courses that grades users, awards tiered Stripe discount codes, and tracks conversion to purchase.

**Architecture:** Standalone tables (`course_challenges`, `challenge_attempts`) separate from the assessments system. Reuses existing `grading.ts` for MC + AI grading. Stripe coupons created automatically via an admin API route. Webhook updated for conversion tracking. New plugin skill + command for authoring challenges.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres), Stripe (coupons/promo codes), OpenAI (short answer grading), ops-course-studio plugin (Claude Code skill system)

---

### Task 1: Database Migration — Create Tables

**Files:**
- Supabase migration via `apply_migration` MCP tool

**Step 1: Run migration**

```sql
-- Challenge quiz per course (one-to-one with courses)
CREATE TABLE course_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  passing_score integer NOT NULL DEFAULT 80,
  discount_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One attempt per user per challenge
CREATE TABLE challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES course_challenges(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  answers jsonb NOT NULL,
  score integer,
  feedback jsonb,
  discount_percentage integer,
  discount_code text,
  status text NOT NULL DEFAULT 'submitted',
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(challenge_id, user_id)
);

-- Index for fast lookup by user
CREATE INDEX idx_challenge_attempts_user ON challenge_attempts(user_id);
-- Index for conversion tracking (webhook needs to find attempts by user + course)
CREATE INDEX idx_challenge_attempts_challenge_user ON challenge_attempts(challenge_id, user_id);
```

Use `mcp__plugin_supabase_supabase__apply_migration` with `project_id: "ijeekuhbatykdomumfjx"`, name: `create_course_challenges`.

**Step 2: Verify tables exist**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('course_challenges', 'challenge_attempts');
```

Expected: 2 rows.

**Step 3: Commit**

```bash
# No local files changed — migration is remote only
```

---

### Task 2: Challenge Query Functions

**Files:**
- Create: `src/lib/supabase/challenge-queries.ts`

**Step 1: Create the query functions file**

```typescript
import { createServiceClient } from './server';

/**
 * Get the challenge quiz for a course (if one exists).
 */
export async function getCourseChallenge(courseId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('course_challenges')
    .select('id, course_id, title, description, questions, passing_score, discount_tiers')
    .eq('course_id', courseId)
    .maybeSingle();
  return data;
}

/**
 * Get a user's challenge attempt for a specific challenge.
 * Returns null if they haven't attempted it.
 */
export async function getChallengeAttempt(challengeId: string, userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('challenge_attempts')
    .select('id, score, feedback, discount_percentage, discount_code, status, created_at, graded_at')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/**
 * Create a challenge attempt (submit + grade results).
 */
export async function createChallengeAttempt(params: {
  challengeId: string;
  userId: string;
  answers: Record<string, unknown>;
  score: number;
  feedback: unknown;
  discountPercentage: number;
  discountCode: string | null;
  status: string;
}) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('challenge_attempts')
    .insert({
      challenge_id: params.challengeId,
      user_id: params.userId,
      answers: params.answers,
      score: params.score,
      feedback: params.feedback,
      discount_percentage: params.discountPercentage,
      discount_code: params.discountCode,
      status: params.status,
      graded_at: params.status === 'graded' ? new Date().toISOString() : null,
    })
    .select('id, score, feedback, discount_percentage, discount_code, status')
    .single();

  if (error) {
    console.error('Error creating challenge attempt:', error);
    return null;
  }
  return data;
}

/**
 * Mark a challenge attempt as converted (user purchased the course).
 */
export async function markChallengeConverted(challengeId: string, userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('challenge_attempts')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
    })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking challenge converted:', error);
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/supabase/challenge-queries.ts
git commit -m "feat: add challenge quiz query functions"
```

---

### Task 3: Challenge Submit + Grade API Route

**Files:**
- Create: `src/app/api/challenge/submit/route.ts`

**Step 1: Create the submit/grade endpoint**

This endpoint does both submission and grading in a single request (unlike assessments which have separate submit + grade endpoints). This is simpler since challenges are one-shot.

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import { createServiceClient } from '@/lib/supabase/server';
import { gradeAssignment } from '@/lib/grading';

const SESSION_COOKIE = 'ops-learn-session';

interface DiscountTier {
  min_score: number;
  max_score: number;
  discount_percent: number;
  stripe_coupon_id: string;
  stripe_promo_code_id: string;
  message: string;
}

export async function POST(request: Request) {
  // Auth
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { challengeId, answers } = await request.json();
  if (!challengeId || !answers) {
    return NextResponse.json({ error: 'challengeId and answers are required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch challenge
  const { data: challenge } = await supabase
    .from('course_challenges')
    .select('id, course_id, title, questions, discount_tiers')
    .eq('id', challengeId)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  // Check if user already attempted
  const { data: existing } = await supabase
    .from('challenge_attempts')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', decoded.uid)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already attempted this challenge' }, { status: 409 });
  }

  // Grade using existing grading library
  const gradingResult = await gradeAssignment(
    { title: challenge.title, instructions: '', questions: challenge.questions },
    answers
  );

  // Calculate percentage score
  const score = gradingResult.maxScore > 0
    ? Math.round((gradingResult.totalScore / gradingResult.maxScore) * 100)
    : 0;

  // Match discount tier
  const tiers = (challenge.discount_tiers as DiscountTier[]) || [];
  const matchedTier = tiers.find(
    (t) => score >= t.min_score && score <= t.max_score
  );

  const discountPercentage = matchedTier?.discount_percent ?? 0;
  const discountCode = matchedTier?.stripe_promo_code_id ?? null;
  const message = matchedTier?.message ?? '';

  // Insert attempt
  const { data: attempt, error: insertError } = await supabase
    .from('challenge_attempts')
    .insert({
      challenge_id: challengeId,
      user_id: decoded.uid,
      answers,
      score,
      feedback: gradingResult.questionFeedback,
      discount_percentage: discountPercentage,
      discount_code: discountCode,
      status: 'graded',
      graded_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[challenge/submit] Error inserting attempt:', insertError);
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    feedback: gradingResult.questionFeedback,
    discountPercentage,
    discountCode,
    message,
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/challenge/submit/route.ts
git commit -m "feat: add challenge submit + grade API route"
```

---

### Task 4: Admin API Route — Create Stripe Coupons

**Files:**
- Create: `src/app/api/admin/create-challenge-coupons/route.ts`

**Step 1: Create the coupon creation endpoint**

This is called by the `create-challenge` plugin command to automatically create Stripe coupons for each discount tier.

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const SESSION_COOKIE = 'ops-learn-session';

// Admin check — only allow specific user IDs
const ADMIN_UIDS = (process.env.ADMIN_FIREBASE_UIDS || '').split(',').map((s) => s.trim());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

interface TierInput {
  min_score: number;
  max_score: number;
  discount_percent: number;
  message: string;
}

export async function POST(request: Request) {
  // Auth — admin only
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const decoded = await verifyIdToken(token);
  if (!decoded || !ADMIN_UIDS.includes(decoded.uid)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { courseSlug, tiers } = await request.json() as {
    courseSlug: string;
    tiers: TierInput[];
  };

  if (!courseSlug || !tiers?.length) {
    return NextResponse.json({ error: 'courseSlug and tiers are required' }, { status: 400 });
  }

  const results = [];

  for (const tier of tiers) {
    // Create Stripe coupon
    const coupon = await stripe.coupons.create({
      percent_off: tier.discount_percent,
      duration: 'once',
      name: `Challenge ${courseSlug} ${tier.discount_percent}% off (score ${tier.min_score}-${tier.max_score})`,
    });

    // Create promotion code for this coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `CHAL-${courseSlug.toUpperCase().slice(0, 10)}-${tier.discount_percent}OFF`.replace(/[^A-Z0-9-]/g, ''),
      max_redemptions: undefined, // unlimited — tracked per user in our DB
    });

    results.push({
      min_score: tier.min_score,
      max_score: tier.max_score,
      discount_percent: tier.discount_percent,
      stripe_coupon_id: coupon.id,
      stripe_promo_code_id: promoCode.id,
      stripe_promo_code: promoCode.code,
      message: tier.message,
    });
  }

  return NextResponse.json({ tiers: results });
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/create-challenge-coupons/route.ts
git commit -m "feat: add admin API route for creating challenge Stripe coupons"
```

---

### Task 5: Checkout Route — Accept Promo Code

**Files:**
- Modify: `src/app/api/checkout/route.ts`

**Step 1: Update checkout to forward promoCode**

The Stripe checkout session edge function already has `allow_promotion_codes: true`, but we want to also support pre-applying a specific promo code from the challenge results. The edge function needs to accept a `discountPromoCodeId` param.

In `src/app/api/checkout/route.ts`, update the body JSON to include the optional `promoCode`:

```typescript
// In the existing POST handler, destructure promoCode from body:
const { courseId, successUrl, cancelUrl, promoCode } = await request.json();

// Pass it to the edge function:
body: JSON.stringify({
  type: 'course_purchase',
  courseId,
  userId: decoded.uid,
  userEmail: decoded.email,
  successUrl,
  cancelUrl,
  promoCode,  // <-- add this
}),
```

**Step 2: Update the Stripe edge function**

In the `stripe-create-checkout-session` edge function, update the `course_purchase` branch to apply the discount:

```typescript
// After: const { courseId, successUrl, cancelUrl } = body;
// Change to:
const { courseId, successUrl, cancelUrl, promoCode } = body;

// In the session creation, replace allow_promotion_codes with explicit discount:
const sessionParams: any = {
  customer: customerId,
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [{ price: course.stripe_price_id, quantity: 1 }],
  success_url: successUrl || "https://learn.opsapp.co/courses",
  cancel_url: cancelUrl || "https://learn.opsapp.co/courses",
  metadata: {
    type: "course_purchase",
    user_id: userId,
    course_id: courseId,
  },
};

if (promoCode) {
  // Pre-apply the challenge discount
  sessionParams.discounts = [{ promotion_code: promoCode }];
} else {
  // Allow manual promo code entry
  sessionParams.allow_promotion_codes = true;
}
```

Deploy updated edge function via `mcp__plugin_supabase_supabase__deploy_edge_function`.

**Step 3: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat: support pre-applied promo codes in checkout"
```

---

### Task 6: Update Stripe Webhook — Conversion Tracking + Purchased Status

**Files:**
- Modify: Supabase edge function `stripe-webhook`

**Step 1: Update the `checkout.session.completed` handler**

Two changes:
1. Insert enrollment with `status: 'purchased'` instead of `'active'` (matches new enrollment flow)
2. Track challenge conversion

```typescript
case "checkout.session.completed": {
  const session = event.data.object;
  const metadata = session.metadata || {};

  if (metadata.type === "course_purchase" && metadata.user_id && metadata.course_id) {
    // Check if enrollment already exists (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", metadata.user_id)
      .eq("course_id", metadata.course_id)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("enrollments").insert({
        user_id: metadata.user_id,
        course_id: metadata.course_id,
        status: "purchased",
      });
    }

    // Track challenge conversion
    const { data: challenge } = await supabaseAdmin
      .from("course_challenges")
      .select("id")
      .eq("course_id", metadata.course_id)
      .maybeSingle();

    if (challenge) {
      await supabaseAdmin
        .from("challenge_attempts")
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
        })
        .eq("challenge_id", challenge.id)
        .eq("user_id", metadata.user_id);
    }
  }
  break;
}
```

Deploy via `mcp__plugin_supabase_supabase__deploy_edge_function`.

**Step 2: Commit**

```bash
# Edge function is deployed remotely, no local file change
```

---

### Task 7: Challenge Page — Server Component

**Files:**
- Create: `src/app/courses/[slug]/challenge/page.tsx`

**Step 1: Create the challenge page**

This is the server component that:
- Gates on auth
- Fetches challenge + existing attempt
- Renders either the form or the results

```typescript
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
  const clientQuestions = challenge.questions.map((q: Record<string, unknown>) => {
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
                questions={challenge.questions}
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
                    questions={clientQuestions}
                    courseSlug={slug}
                    courseId={course.id}
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
```

**Step 2: Commit**

```bash
git add src/app/courses/[slug]/challenge/page.tsx
git commit -m "feat: add challenge page server component"
```

---

### Task 8: ChallengeForm Client Component

**Files:**
- Create: `src/components/ChallengeForm.tsx`

**Step 1: Create the form component**

Pattern follows `AssessmentForm.tsx` but simplified (single attempt, combined submit+grade).

```typescript
'use client';

import { useState } from 'react';
import ChallengeResults from './ChallengeResults';

interface MCQuestion {
  id: string;
  type: 'multiple_choice';
  question: string;
  options: string[];
  points: number;
}

interface ShortAnswerQuestion {
  id: string;
  type: 'short_answer';
  question: string;
  points: number;
}

type Question = MCQuestion | ShortAnswerQuestion;

interface FeedbackItem {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface ChallengeFormProps {
  challengeId: string;
  questions: Question[];
  courseSlug: string;
  courseId: string;
  priceCents: number;
}

export default function ChallengeForm({
  challengeId,
  questions,
  courseSlug,
  courseId,
  priceCents,
}: ChallengeFormProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    feedback: FeedbackItem[];
    discountPercentage: number;
    discountCode: string | null;
    message: string;
  } | null>(null);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // Check all questions answered
  const allAnswered = questions.every((q) => {
    const a = answers[q.id];
    if (q.type === 'multiple_choice') return a !== undefined && a !== null;
    if (q.type === 'short_answer') return typeof a === 'string' && a.trim().length > 0;
    return false;
  });

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setResult({
        score: data.score,
        feedback: data.feedback,
        discountPercentage: data.discountPercentage,
        discountCode: data.discountCode,
        message: data.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Show results if graded
  if (result) {
    return (
      <ChallengeResults
        courseSlug={courseSlug}
        courseId={courseId}
        courseTitle=""
        priceCents={priceCents}
        score={result.score}
        feedback={result.feedback}
        questions={questions}
        discountPercentage={result.discountPercentage}
        discountCode={result.discountCode}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-[3px] border border-ops-border bg-ops-surface p-6">
          <p className="mb-1 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Question {idx + 1} of {questions.length}
            <span className="ml-2 text-ops-text-secondary/40">{q.points} pts</span>
          </p>
          <p className="font-body text-sm leading-relaxed text-ops-text-primary">
            {q.question}
          </p>

          {q.type === 'multiple_choice' && (
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => setAnswer(q.id, optIdx)}
                  className={`cursor-pointer rounded-[3px] border px-4 py-3 text-left font-body text-sm transition-all ${
                    answers[q.id] === optIdx
                      ? 'border-ops-accent bg-ops-accent/10 text-ops-text-primary'
                      : 'border-ops-border text-ops-text-secondary hover:border-ops-border-hover hover:text-ops-text-primary'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'short_answer' && (
            <textarea
              className="mt-4 w-full rounded-[3px] border border-ops-border bg-ops-background px-4 py-3 font-body text-sm text-ops-text-primary placeholder:text-ops-text-secondary/40 focus:border-ops-accent focus:outline-none"
              rows={4}
              placeholder="Type your answer..."
              value={(answers[q.id] as string) ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-ops-text-primary px-8 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-background transition-all duration-200 hover:bg-white/90 active:bg-white/80 disabled:opacity-50"
        >
          {submitting ? 'Grading...' : 'Submit Challenge'}
        </button>
        {!allAnswered && (
          <p className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary/50">
            Answer all questions to submit
          </p>
        )}
        {error && <p className="font-body text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ChallengeForm.tsx
git commit -m "feat: add ChallengeForm client component"
```

---

### Task 9: ChallengeResults Client Component

**Files:**
- Create: `src/components/ChallengeResults.tsx`

**Step 1: Create the results display component**

```typescript
'use client';

import { useState } from 'react';

interface FeedbackItem {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface ChallengeResultsProps {
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  priceCents: number;
  score: number;
  feedback: FeedbackItem[];
  questions: Array<{ id: string; question: string; type: string; options?: string[] }>;
  discountPercentage: number;
  discountCode: string | null;
}

export default function ChallengeResults({
  courseSlug,
  courseId,
  priceCents,
  score,
  feedback,
  questions,
  discountPercentage,
  discountCode,
}: ChallengeResultsProps) {
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const discountedPrice = priceCents * (1 - discountPercentage / 100);

  async function handleBuyWithDiscount() {
    setBuyLoading(true);
    setBuyError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          successUrl: `${window.location.origin}/courses/${courseSlug}?paid=true`,
          cancelUrl: `${window.location.origin}/courses/${courseSlug}/challenge`,
          promoCode: discountCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setBuyError(message);
      setBuyLoading(false);
    }
  }

  // Determine tier message
  let tierMessage = '';
  if (score <= 20) tierMessage = "Good try — let's pump those numbers up";
  else if (score <= 50) tierMessage = 'Room to grow — this course will get you there';
  else if (score <= 75) tierMessage = 'Solid foundation — time to level up';
  else if (score <= 90) tierMessage = "Well done — let's get you the rest of the way";
  else tierMessage = 'Impressive — you really know your stuff';

  return (
    <div>
      {/* Score hero */}
      <div className="mb-10 text-center">
        <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
          Your Score
        </p>
        <p
          className="mt-2 font-heading font-bold text-ops-text-primary"
          style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1 }}
        >
          {score}%
        </p>
        <p className="mt-3 font-body text-base font-light text-ops-text-secondary">
          {tierMessage}
        </p>
      </div>

      {/* Discount CTA */}
      {discountPercentage > 0 && (
        <div className="mb-10 rounded-[3px] border border-ops-accent/30 bg-ops-accent/5 p-6 text-center">
          <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-accent">
            You earned {discountPercentage}% off
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-ops-text-primary">
            <span className="text-ops-text-secondary/40 line-through">
              ${(priceCents / 100).toFixed(0)}
            </span>{' '}
            ${(discountedPrice / 100).toFixed(0)}
          </p>
          <button
            onClick={handleBuyWithDiscount}
            disabled={buyLoading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-[3px] bg-ops-text-primary px-8 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-background transition-all duration-200 hover:bg-white/90 active:bg-white/80 disabled:opacity-50"
          >
            {buyLoading ? 'Redirecting...' : `Buy Course — $${(discountedPrice / 100).toFixed(0)}`}
          </button>
          {buyError && <p className="mt-2 font-body text-sm text-red-400">{buyError}</p>}
        </div>
      )}

      {/* Per-question feedback */}
      <div className="flex flex-col gap-4">
        <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
          [ Question Breakdown ]
        </p>
        {feedback.map((fb, idx) => {
          const question = questions.find((q) => q.id === fb.questionId);
          return (
            <div
              key={fb.questionId}
              className="rounded-[3px] border border-ops-border bg-ops-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-body text-sm text-ops-text-primary">
                  <span className="mr-2 font-caption text-[10px] text-ops-text-secondary">
                    Q{idx + 1}
                  </span>
                  {question?.question}
                </p>
                <span
                  className={`shrink-0 rounded-[3px] px-2 py-0.5 font-caption text-[10px] uppercase tracking-[0.1em] ${
                    fb.score === fb.maxPoints
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : fb.score > 0
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {fb.score}/{fb.maxPoints}
                </span>
              </div>
              <p className="mt-2 font-body text-xs font-light leading-relaxed text-ops-text-secondary">
                {fb.feedback}
              </p>
            </div>
          );
        })}
      </div>

      {/* Back to course */}
      <div className="mt-8">
        <a
          href={`/courses/${courseSlug}`}
          className="font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
        >
          &larr; Back to Course
        </a>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ChallengeResults.tsx
git commit -m "feat: add ChallengeResults component with discount CTA"
```

---

### Task 10: Course Detail Page — Add Challenge Button

**Files:**
- Modify: `src/app/courses/[slug]/page.tsx`

**Step 1: Import challenge queries**

Add to the imports at top of file:
```typescript
import { getCourseChallenge, getChallengeAttempt } from '@/lib/supabase/challenge-queries';
```

**Step 2: Fetch challenge data**

After the enrollment logic (around line 33), add:
```typescript
// Check if course has a challenge quiz
const challenge = !isFree ? await getCourseChallenge(course.id) : null;
let challengeAttempt = null;
if (challenge && sessionUser) {
  challengeAttempt = await getChallengeAttempt(challenge.id, sessionUser.uid);
}
```

**Step 3: Add challenge button to the CTA area**

After the `<EnrollButton>` div (around line 119), add a challenge button:
```tsx
{/* Challenge CTA — only for paid courses with a challenge, not yet enrolled */}
{challenge && enrolled !== true && (
  <div className="mt-3">
    <a
      href={`/courses/${slug}/challenge`}
      className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ops-border px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-text-secondary transition-all duration-200 hover:border-ops-border-hover hover:text-ops-text-primary"
    >
      {challengeAttempt
        ? 'View Challenge Results'
        : 'Challenge This Course'}
    </a>
  </div>
)}
```

**Step 4: Commit**

```bash
git add src/app/courses/[slug]/page.tsx
git commit -m "feat: add Challenge This Course button to course detail page"
```

---

### Task 11: Plugin Skill — Challenge Authoring

**Files:**
- Create: `~/.claude/plugins/cache/custom-skills-plugin/ops-course-studio/1.0.0/skills/challenge-authoring/SKILL.md`

**Step 1: Create the skill file**

```markdown
---
name: challenge-authoring
version: 1.0.0
description: >
  Use when creating challenge quizzes for paid courses. Challenge quizzes are deliberately difficult
  assessments designed to humble overconfident business owners and reward genuine knowledge with
  tiered discounts. Triggers on "create a challenge", "challenge quiz", "challenge this course",
  or any task involving pre-purchase knowledge testing.
---

# Challenge Quiz Authoring

## Purpose

Create deliberately difficult challenge quizzes that test whether a business owner truly knows the
material before buying a course. The challenge serves two purposes:
1. **Humble the overconfident** — Show "mentrepreneurs" they have knowledge gaps
2. **Reward the knowledgeable** — Genuine experts earn meaningful discounts

## Philosophy

> Business owners and "mentrepreneurs" often overestimate their knowledge. Your job is to write
> questions that an experienced-but-undereducated owner would struggle with. If someone passes
> this challenge, they genuinely know their stuff.

## Challenge Specifications

- **Scope**: 8-10 questions per challenge
- **Question types**: `multiple_choice` (~6) and `short_answer` (~3)
- **Difficulty**: HIGH — this is NOT a comprehension check, it's a prove-it test
- **Total points**: 100 (typically 60 MC + 40 short answer)
- **One attempt only**: No retakes — stakes matter

## Discount Tiers (U-shaped curve)

| Score | Discount | Reasoning |
|-------|----------|-----------|
| 0-20% | 40% off | Honest effort, clearly needs the course |
| 21-50% | 30% off | Some knowledge, significant gaps |
| 51-75% | 20% off | Middle of the road |
| 76-90% | 40% off | Strong knowledge, course fills remaining gaps |
| 91-100% | 50% off | Genuinely impressive, reward the expert |

## Question Writing Rules

### Multiple Choice (Difficulty: HARD)

**Format:** Same as quiz-authoring MC format (4 options, 0-based correct_answer, 10 points each)

**CRITICAL DIFFERENCES from regular quizzes:**
- **Distractors must be what a confident-but-wrong person would choose**
- Every wrong answer should sound right to someone with surface-level knowledge
- Test APPLICATION, not recall — never ask "what is X"
- Ask "when X happens, what should you do and WHY"
- Include industry-specific nuances that separate pros from amateurs
- Reference real scenarios that separate book knowledge from field experience

**Good challenge MC:**
```json
{
  "id": "ch1",
  "type": "multiple_choice",
  "question": "Your crew finishes a residential HVAC install two days early. The client is thrilled and asks if you can start their neighbor's job ahead of schedule. What's the best business decision?",
  "options": [
    "Start the neighbor's job immediately — the crew is available and the client is happy",
    "Invoice the current job first, confirm the neighbor's scope and materials, then schedule",
    "Offer a discount to the neighbor since you're already on-site",
    "Have the crew take the two days off as a reward for finishing early"
  ],
  "correct_answer": 1,
  "points": 10
}
```

**Bad challenge MC (too easy, tests recall):**
```json
{
  "question": "What is a profit margin?",
  "options": ["Revenue minus costs", "Revenue divided by costs", "Revenue minus costs divided by revenue", "Total sales"]
}
```

### Short Answer (Difficulty: HARD)

**Format:** Same as quiz-authoring short answer format (rubric, 12-15 points each)

**CRITICAL DIFFERENCES:**
- Questions should require SPECIFIC, CONCRETE answers
- Vague generalities ("communication is important") = partial credit at best
- Must reference real-world trades scenarios
- Rubric should be strict — demand specificity

**Good challenge short answer:**
```json
{
  "id": "ch8",
  "type": "short_answer",
  "question": "You have three crews running simultaneously. One crew lead calls in sick on a day with a high-value commercial job. Walk through your exact decision process for the next 30 minutes.",
  "rubric": "Full credit requires: (1) specific steps in order, (2) consideration of both the sick crew lead's job AND impact on other crews, (3) a communication plan for the affected client. Partial credit for general 'call someone else' without specifics. No credit for vague answers like 'figure it out' or 'reschedule'.",
  "points": 15
}
```

## Process

1. **Read ALL course content** — every lesson across every module. You need to understand the full scope of what the course teaches to write questions that test it.
2. **Identify 8-10 key concepts** that span the course — not just one module
3. **For each concept, find the misconception** — what do overconfident owners get wrong?
4. **Write the question around the misconception** — make the wrong answer tempting
5. **Order questions from MC to short answer** — build difficulty gradually
6. **Assign IDs** — use prefix `ch` (e.g., `ch1`, `ch2`, ... `ch10`)
7. **Calculate total points** — verify they sum to ~100

## Insert Template

Challenges go into `course_challenges`, NOT `assessments`:

```sql
INSERT INTO course_challenges (course_id, title, description, questions, passing_score, discount_tiers)
VALUES (
  'COURSE_UUID',
  'Challenge: [Course Title]',
  'Think you already know this? Prove it. Score well and earn a discount.',
  '[QUESTIONS_JSON]'::jsonb,
  80,
  '[DISCOUNT_TIERS_JSON]'::jsonb
)
RETURNING id, title;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
```

**Step 2: Commit**

```bash
git add ~/.claude/plugins/cache/custom-skills-plugin/ops-course-studio/1.0.0/skills/challenge-authoring/SKILL.md
git commit -m "feat: add challenge-authoring skill to ops-course-studio"
```

---

### Task 12: Plugin Command — `/create-challenge`

**Files:**
- Create: `~/.claude/plugins/cache/custom-skills-plugin/ops-course-studio/1.0.0/commands/create-challenge.md`

**Step 1: Create the command file**

```markdown
---
name: create-challenge
description: "Create a 'Challenge This Course' quiz for a paid ops-learn course. Generates hard questions, creates Stripe coupons, and inserts into Supabase."
---

# Create Challenge Quiz

You are creating a challenge quiz for a paid course. Follow these steps:

## Step 1: Select Course

Query paid courses:

```sql
SELECT id, title, slug, price_cents FROM courses
WHERE status = 'published' AND price_cents > 0
ORDER BY sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

Ask the user to select a course.

Then verify it doesn't already have a challenge:

```sql
SELECT id FROM course_challenges WHERE course_id = '[COURSE_ID]';
```

If a challenge exists, inform the user and stop.

## Step 2: Verify Course Completeness

Fetch the full course structure:

```sql
SELECT m.title as module_title, COUNT(l.id) as lesson_count
FROM modules m
LEFT JOIN lessons l ON l.module_id = m.id
WHERE m.course_id = '[COURSE_ID]'
GROUP BY m.id, m.title, m.sort_order
ORDER BY m.sort_order;
```

Show the module/lesson counts. Ask: "Does this course look complete enough to write a challenge?"

## Step 3: Read All Course Content

Fetch ALL lesson content blocks across the entire course:

```sql
SELECT m.title as module_title, l.title as lesson_title, cb.type, cb.content
FROM content_blocks cb
JOIN lessons l ON cb.lesson_id = l.id
JOIN modules m ON l.module_id = m.id
WHERE m.course_id = '[COURSE_ID]'
ORDER BY m.sort_order, l.sort_order, cb.sort_order;
```

Read and internalize all the content. You need to understand every concept taught.

## Step 4: Generate Questions

Invoke the **challenge-authoring** skill knowledge. Generate 8-10 questions:
- ~6 multiple choice (10 pts each = 60 pts)
- ~3 short answer (12-15 pts each = ~40 pts)
- Total: ~100 points

Remember: Questions must be DELIBERATELY DIFFICULT. See challenge-authoring skill for philosophy and examples.

Present ALL questions to the user for review and approval.

## Step 5: Configure Discount Tiers

Present the default tiers and ask if user wants to adjust:

| Score | Discount |
|-------|----------|
| 0-20% | 40% off |
| 21-50% | 30% off |
| 51-75% | 20% off |
| 76-90% | 40% off |
| 91-100% | 50% off |

Ask: "Use these default discount tiers, or customize?"

## Step 6: Create Stripe Coupons

Call the admin API to create Stripe coupons for each tier:

```
POST /api/admin/create-challenge-coupons
{
  "courseSlug": "[COURSE_SLUG]",
  "tiers": [
    { "min_score": 0, "max_score": 20, "discount_percent": 40, "message": "Good try — let's pump those numbers up" },
    { "min_score": 21, "max_score": 50, "discount_percent": 30, "message": "" },
    { "min_score": 51, "max_score": 75, "discount_percent": 20, "message": "" },
    { "min_score": 76, "max_score": 90, "discount_percent": 40, "message": "Well done — let's get you the rest of the way" },
    { "min_score": 91, "max_score": 100, "discount_percent": 50, "message": "" }
  ]
}
```

**IMPORTANT:** This API route requires admin authentication. The user must be signed in to the ops-learn site as an admin for this to work. If it fails, the user can create coupons manually in Stripe and provide the IDs.

If the API route is not available, ask the user to create the coupons in Stripe dashboard and provide the coupon/promo code IDs for each tier.

## Step 7: Insert Challenge

```sql
INSERT INTO course_challenges (course_id, title, description, questions, passing_score, discount_tiers)
VALUES (
  '[COURSE_ID]',
  'Challenge: [Course Title]',
  'Think you already know this? Prove it. Score well and earn a discount.',
  '[QUESTIONS_JSON]'::jsonb,
  80,
  '[DISCOUNT_TIERS_JSON]'::jsonb
)
RETURNING id, title;
```

## Step 8: Confirm

Report:
- Challenge ID
- Number of questions and total points
- Discount tiers configured
- Remind user the challenge page is at `/courses/[slug]/challenge`
```

**Step 2: Commit**

```bash
git add ~/.claude/plugins/cache/custom-skills-plugin/ops-course-studio/1.0.0/commands/create-challenge.md
git commit -m "feat: add /create-challenge command to ops-course-studio"
```

---

### Task 13: Build Verification

**Step 1: Run TypeScript check**

```bash
cd ops-learn && npx tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: No errors.

**Step 2: Run Next.js build**

```bash
cd ops-learn && npx next build
```

Expected: Build succeeds, `/courses/[slug]/challenge` appears in route list, `/api/challenge/submit` appears.

**Step 3: Verify database tables**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('course_challenges', 'challenge_attempts');
```

Expected: 2 rows.

---

Plan complete and saved to `docs/plans/2026-02-25-challenge-this-course-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?

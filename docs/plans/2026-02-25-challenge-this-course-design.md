# Challenge This Course — Design Document

**Date:** 2026-02-25
**Status:** Approved

## Purpose

Add a free "Challenge This Course" quiz to every paid course. The challenge is deliberately difficult — designed to humble overconfident business owners into realizing they could use the education. Users who score well are rewarded with meaningful discounts.

Every score earns a discount (U-shaped curve rewarding honest effort at the bottom AND genuine knowledge at the top):

| Score Range | Discount | Messaging |
|-------------|----------|-----------|
| 0-20%       | 40% off  | Good try — let's pump those numbers up |
| 21-50%      | 30% off  | |
| 51-75%      | 20% off  | |
| 76-90%      | 40% off  | Well done — let's get you the rest of the way |
| 91-100%     | 50% off  | |

One attempt only. Requires sign-in. Tracks conversion (challenge → purchase).

## Database Schema

### `course_challenges` table

```sql
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
```

- One challenge per course (unique on `course_id`)
- `questions`: Same JSONB format as assessments — `multiple_choice` + `short_answer` types
- `discount_tiers`: Array of `{ min_score, max_score, discount_percent, stripe_coupon_id, stripe_promo_code_id, message }`

Example `discount_tiers`:
```json
[
  { "min_score": 0,  "max_score": 20,  "discount_percent": 40, "stripe_coupon_id": "...", "stripe_promo_code_id": "...", "message": "Good try — let's pump those numbers up" },
  { "min_score": 21, "max_score": 50,  "discount_percent": 30, "stripe_coupon_id": "...", "stripe_promo_code_id": "...", "message": "" },
  { "min_score": 51, "max_score": 75,  "discount_percent": 20, "stripe_coupon_id": "...", "stripe_promo_code_id": "...", "message": "" },
  { "min_score": 76, "max_score": 90,  "discount_percent": 40, "stripe_coupon_id": "...", "stripe_promo_code_id": "...", "message": "Well done — let's get you the rest of the way" },
  { "min_score": 91, "max_score": 100, "discount_percent": 50, "stripe_coupon_id": "...", "stripe_promo_code_id": "...", "message": "" }
]
```

### `challenge_attempts` table

```sql
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
```

- `UNIQUE(challenge_id, user_id)` enforces one attempt per user per challenge
- `discount_percentage`: The discount earned (e.g. 40)
- `discount_code`: The Stripe promo code string for display/use
- `converted` / `converted_at`: Flipped when user purchases the course after taking the challenge
- `status`: `submitted` | `grading` | `graded` | `error`
- `answers` and `feedback`: Same JSONB formats as assessment_submissions

## Question Format

Same as existing assessments:

**Multiple Choice:**
```json
{
  "id": "ch1",
  "type": "multiple_choice",
  "question": "When a client says..., what should you do?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 2,
  "points": 10
}
```

**Short Answer:**
```json
{
  "id": "ch7",
  "type": "short_answer",
  "question": "Describe the approach you'd take when...",
  "rubric": "Award full points for specific, actionable answers that demonstrate...",
  "points": 15
}
```

8-10 questions per challenge (~6 MC + ~3 short answer).

## Page & UI Flow

### New route: `/courses/[slug]/challenge`

1. Auth gate — redirect to login if not signed in
2. If user already has a `challenge_attempts` row → show results (score, feedback, discount code, buy CTA)
3. If no attempt → show challenge form:
   - Title + description (tone: "Think you already know this? Prove it.")
   - All questions on one page
   - Submit button
4. On submit → `POST /api/challenge/submit`
   - MC graded instantly
   - Short answers graded via AI (existing `gradeAssignment` logic)
   - Score calculated, discount tier matched
   - Stripe promo code looked up from tier
   - Attempt row created with score, feedback, discount info
5. Results page:
   - Score display with tier messaging
   - Per-question feedback
   - Discount code prominently displayed
   - "BUY WITH DISCOUNT" CTA (passes promo code to checkout)

### Course detail page changes

- Paid courses with a challenge: show "CHALLENGE THIS COURSE" button
- If user already attempted: show "VIEW CHALLENGE RESULTS" instead
- Position: alongside/below the "BUY COURSE" button

## API Routes

### `POST /api/challenge/submit`

- Verify session cookie
- Validate: challenge exists, user hasn't already attempted
- Grade MC questions (deterministic)
- Grade short answer questions (AI via existing grading lib)
- Calculate score percentage
- Match score to discount tier
- Insert `challenge_attempts` row
- Return `{ score, feedback, discountPercentage, discountCode, message }`

### `GET /api/challenge/[challengeId]/result`

- Verify session cookie
- Return existing attempt for this user (score, feedback, discount info)

### Update `POST /api/checkout`

- Accept optional `promoCode` parameter
- Pass it to the Stripe checkout session as `discounts: [{ promotion_code: promoCode }]`

## Stripe Integration

### Coupon creation (automated)

When a challenge is created via the `create-challenge` skill:

1. For each discount tier, call Stripe API to create:
   - A coupon (`stripe.coupons.create({ percent_off, duration: 'once' })`)
   - A promotion code (`stripe.promotionCodes.create({ coupon, code })`)
2. Store the coupon ID and promo code ID in `discount_tiers`

This requires a Supabase edge function or API route: `POST /api/admin/create-challenge-coupons`

### Conversion tracking

When a user purchases a course (Stripe webhook or checkout success):
- Check if `challenge_attempts` row exists for that `user_id` + `course_id`
- If yes, update `converted = true`, `converted_at = now()`

## Skill: `create-challenge`

New skill added to `ops-course-studio` plugin.

### Trigger
`/create-challenge` command

### Process

1. Select course (must be paid, must have all modules/lessons built)
2. Read ALL lesson content across the entire course
3. Generate 8-10 questions (~6 MC + ~3 short answer)
4. Prompt author for discount tier percentages (defaults: 40/30/20/40/50)
5. Create Stripe coupons via API route
6. INSERT into `course_challenges`
7. Confirm creation

### Question Authoring Philosophy

The challenge is designed to be **deliberately difficult**. Business owners and "mentrepreneurs" often overestimate their knowledge. The quiz should make them realize they have gaps.

**Principles:**
- Target common misconceptions that experienced-but-undereducated owners hold
- Test nuanced distinctions, not surface-level recall
- Use application scenarios that require genuine understanding
- Every MC distractor should be something a confident-but-wrong person would choose
- Short answer rubrics demand specific, concrete answers — vague generalities earn partial credit at best
- Don't ask "what is X" — ask "when X happens, what should you do and why"
- Frame questions around real-world scenarios owners face daily
- Include industry-specific knowledge that "I've been doing this 20 years" folks often get wrong

### Skill File Structure

```
ops-course-studio/
  skills/
    challenge-authoring/
      SKILL.md          # Question writing guidelines
  commands/
    create-challenge/
      COMMAND.md         # Slash command flow
```

## Analytics Value

The `challenge_attempts` table enables:
- **Conversion funnel:** challenges taken → scores → discounts offered → purchases
- **Question difficulty:** which questions get wrong answers most often
- **Score distribution:** are challenges appropriately difficult
- **Discount ROI:** does offering discounts increase conversion enough to justify the margin hit
- **Tier analysis:** which score bands convert best

## Files to Create/Modify

### New files:
1. `src/app/courses/[slug]/challenge/page.tsx` — Challenge page (form + results)
2. `src/components/ChallengeForm.tsx` — Client component for the quiz form
3. `src/components/ChallengeResults.tsx` — Client component for results display
4. `src/app/api/challenge/submit/route.ts` — Submit + grade endpoint
5. `src/app/api/admin/create-challenge-coupons/route.ts` — Stripe coupon creation
6. `src/lib/supabase/challenge-queries.ts` — DB query functions for challenges
7. Supabase migration — `course_challenges` + `challenge_attempts` tables
8. `ops-course-studio/skills/challenge-authoring/SKILL.md` — Authoring skill
9. `ops-course-studio/commands/create-challenge/COMMAND.md` — Slash command

### Modified files:
1. `src/app/courses/[slug]/page.tsx` — Add challenge button to course detail
2. `src/components/EnrollButton.tsx` — Handle discount display state
3. `src/app/api/checkout/route.ts` — Accept optional promo code
4. Stripe webhook handler — Track challenge conversions

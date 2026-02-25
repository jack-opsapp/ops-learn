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
  courseTitle: string;
  priceCents: number;
}

export default function ChallengeForm({
  challengeId,
  questions,
  courseSlug,
  courseId,
  courseTitle,
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

  if (result) {
    return (
      <ChallengeResults
        courseSlug={courseSlug}
        courseId={courseId}
        courseTitle={courseTitle}
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

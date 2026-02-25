'use client';

import { useState, useEffect, useCallback } from 'react';
import AssignmentFeedback from './AssignmentFeedback';

// --- Types ---

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

interface WorkbookPart {
  id: string;
  prompt: string;
  type: 'text' | 'textarea';
}

interface WorkbookQuestion {
  id: string;
  type: 'workbook';
  question: string;
  parts: WorkbookPart[];
  points: number;
}

type Question = MCQuestion | ShortAnswerQuestion | WorkbookQuestion;

interface QuestionFeedback {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface Submission {
  id: string;
  attempt_number: number;
  answers: Record<string, unknown>;
  score: number | null;
  feedback: QuestionFeedback[] | null;
  status: string;
}

interface AssessmentFormProps {
  assessmentId: string;
  title: string;
  instructions: string;
  questions: Question[];
  assessmentType: 'quiz' | 'assignment' | 'test';
  maxRetakes: number;
  passingScore: number;
  userId: string;
}

type FormState = 'idle' | 'submitting' | 'grading' | 'graded';

// --- Sub-components ---

function MCQuestionRenderer({
  question,
  value,
  onChange,
  disabled,
}: {
  question: MCQuestion;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      {question.options.map((option, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => !disabled && onChange(idx)}
          disabled={disabled}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-[3px] border p-3 text-left transition-all duration-200 ${
            value === idx
              ? 'border-ops-accent bg-ops-accent/[0.05]'
              : 'border-ops-border hover:border-ops-border-hover'
          } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              value === idx
                ? 'border-ops-accent'
                : 'border-ops-text-secondary'
            }`}
          >
            {value === idx && (
              <div className="h-2 w-2 rounded-full bg-ops-accent" />
            )}
          </div>
          <span className="font-body text-sm font-light text-ops-text-primary">
            {option}
          </span>
        </button>
      ))}
    </div>
  );
}

function ShortAnswerRenderer({
  value,
  onChange,
  disabled,
}: {
  question: ShortAnswerQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={4}
      className="w-full resize-y rounded-[3px] border border-ops-border bg-ops-surface p-3 font-body text-sm font-light text-ops-text-primary placeholder:text-ops-text-secondary/50 focus:border-ops-accent focus:outline-none disabled:opacity-60"
      placeholder="Type your answer..."
    />
  );
}

function WorkbookRenderer({
  question,
  value,
  onChange,
  disabled,
}: {
  question: WorkbookQuestion;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {question.parts.map((part) => (
        <div key={part.id}>
          <label className="mb-1.5 block font-body text-sm font-light text-ops-text-primary">
            {part.prompt}
          </label>
          {part.type === 'textarea' ? (
            <textarea
              value={value[part.id] ?? ''}
              onChange={(e) =>
                onChange({ ...value, [part.id]: e.target.value })
              }
              disabled={disabled}
              rows={3}
              className="w-full resize-y rounded-[3px] border border-ops-border bg-ops-surface p-3 font-body text-sm font-light text-ops-text-primary placeholder:text-ops-text-secondary/50 focus:border-ops-accent focus:outline-none disabled:opacity-60"
              placeholder="Type your answer..."
            />
          ) : (
            <input
              type="text"
              value={value[part.id] ?? ''}
              onChange={(e) =>
                onChange({ ...value, [part.id]: e.target.value })
              }
              disabled={disabled}
              className="w-full rounded-[3px] border border-ops-border bg-ops-surface p-3 font-body text-sm font-light text-ops-text-primary placeholder:text-ops-text-secondary/50 focus:border-ops-accent focus:outline-none disabled:opacity-60"
              placeholder="Type your answer..."
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Main ---

export default function AssessmentForm({
  assessmentId,
  title,
  instructions,
  questions,
  assessmentType,
  maxRetakes,
  passingScore,
  userId,
}: AssessmentFormProps) {
  const [state, setState] = useState<FormState>('idle');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const attemptsRemaining = maxRetakes - attemptCount;
  const hasAttemptsLeft = attemptsRemaining > 0;

  // Load existing submissions on mount
  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/assessments/submissions?assessmentId=${assessmentId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.submissions?.length > 0) {
        setAttemptCount(data.submissions.length);
        // Find latest graded submission
        const graded = data.submissions.find((s: Submission) => s.status === 'graded');
        if (graded) {
          setSubmission(graded);
          setAnswers(graded.answers ?? {});
          setState('graded');
        } else {
          // Latest submission exists but not graded — trigger grading
          const latest = data.submissions[0];
          setAnswers(latest.answers ?? {});
          await triggerGrading(latest.id);
        }
      }
    } catch {
      // Silently fail
    }
  }, [assessmentId]);

  useEffect(() => {
    if (userId) loadSubmissions();
  }, [userId, loadSubmissions]);

  async function triggerGrading(submissionId: string) {
    setState('grading');
    setError(null);

    try {
      const res = await fetch('/api/assessments/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Grading failed');
      }

      const result = await res.json();
      setSubmission((prev) =>
        prev
          ? { ...prev, score: result.score, feedback: result.feedback, status: 'graded' }
          : { id: submissionId, attempt_number: attemptCount, answers, score: result.score, feedback: result.feedback, status: 'graded' }
      );
      setState('graded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grading failed');
      setState('idle');
    }
  }

  async function handleSubmit() {
    setState('submitting');
    setError(null);

    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Submission failed');
      }

      const { submissionId, attemptNumber } = await res.json();
      setAttemptCount(attemptNumber);
      setSubmission({
        id: submissionId,
        attempt_number: attemptNumber,
        answers,
        score: null,
        feedback: null,
        status: 'submitted',
      });

      await triggerGrading(submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setState('idle');
    }
  }

  function handleRetake() {
    if (!hasAttemptsLeft) return;
    setAnswers({});
    setSubmission(null);
    setState('idle');
    setError(null);
  }

  const isDisabled = state !== 'idle';

  const typeLabel = assessmentType === 'test' ? 'Module Test' : assessmentType === 'assignment' ? 'Assignment' : 'Quiz';

  // Graded state — show feedback
  if (state === 'graded' && submission?.feedback && submission.score !== null) {
    const passed = submission.score >= passingScore;

    return (
      <div>
        {/* Attempt counter */}
        <div className="mb-6 flex items-center gap-4">
          <span className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Attempt {attemptCount} of {maxRetakes}
          </span>
          {passed && (
            <span className="rounded-[2px] bg-ops-success/10 px-2 py-0.5 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-success">
              Passed
            </span>
          )}
        </div>

        <AssignmentFeedback
          score={submission.score}
          feedback={submission.feedback}
          questions={questions}
          onRetake={hasAttemptsLeft ? handleRetake : undefined}
          attemptsRemaining={attemptsRemaining}
        />
      </div>
    );
  }

  // No attempts left
  if (!hasAttemptsLeft && state === 'idle' && attemptCount > 0) {
    return (
      <div className="rounded-[3px] border border-ops-border bg-ops-surface p-8 text-center">
        <p className="font-heading text-lg font-medium text-ops-text-primary">
          No attempts remaining
        </p>
        <p className="mt-2 font-body text-sm font-light text-ops-text-secondary">
          You have used all {maxRetakes} attempts for this {typeLabel.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Attempt counter (only show if attempted before) */}
      {attemptCount > 0 && (
        <div className="mb-6">
          <span className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Attempt {attemptCount + 1} of {maxRetakes}
          </span>
        </div>
      )}

      {/* Instructions */}
      <p className="mb-8 font-body text-sm font-light leading-relaxed text-ops-text-secondary">
        {instructions}
      </p>

      {/* Questions */}
      <div className="space-y-8">
        {questions.map((question, idx) => (
          <div key={question.id}>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-caption text-[10px] text-ops-text-secondary">
                {idx + 1}.
              </span>
              <p className="font-body text-sm text-ops-text-primary">
                {question.question}
              </p>
              <span className="ml-auto shrink-0 font-caption text-[10px] text-ops-text-secondary">
                {question.points} pts
              </span>
            </div>

            {question.type === 'multiple_choice' && (
              <MCQuestionRenderer
                question={question}
                value={answers[question.id] as number | undefined}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
                disabled={isDisabled}
              />
            )}

            {question.type === 'short_answer' && (
              <ShortAnswerRenderer
                question={question}
                value={(answers[question.id] as string) ?? ''}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
                disabled={isDisabled}
              />
            )}

            {question.type === 'workbook' && (
              <WorkbookRenderer
                question={question}
                value={(answers[question.id] as Record<string, string>) ?? {}}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
                disabled={isDisabled}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 font-body text-sm text-red-400">{error}</p>
      )}

      {/* Submit */}
      <div className="mt-8">
        {state === 'submitting' || state === 'grading' ? (
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ops-accent border-t-transparent" />
            <span className="font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
              {state === 'submitting' ? 'Submitting...' : 'Grading with AI...'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-ops-accent px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-white transition-all duration-200 hover:bg-ops-accent/90 active:bg-ops-accent/80 disabled:opacity-50"
          >
            Submit {typeLabel}
          </button>
        )}
      </div>
    </div>
  );
}

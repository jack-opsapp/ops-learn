'use client';

interface QuestionFeedback {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface AssignmentFeedbackProps {
  score: number; // 0-100 percentage
  feedback: QuestionFeedback[];
  questions: Array<{
    id: string;
    type: string;
    question: string;
  }>;
  onRetake?: () => void;
  attemptsRemaining?: number;
}

export default function AssignmentFeedback({
  score,
  feedback,
  questions,
  onRetake,
  attemptsRemaining,
}: AssignmentFeedbackProps) {
  const scoreColor =
    score >= 80
      ? 'text-ops-success'
      : score >= 50
        ? 'text-ops-warning'
        : 'text-ops-rose';

  const summary =
    score >= 80
      ? 'Solid grasp of the material.'
      : score >= 50
        ? 'Good effort — review the feedback to strengthen weak areas.'
        : 'Review the material and try again when ready.';

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="glass-surface flex items-center gap-6 p-6">
        <div className="text-center">
          <p
            className={`font-mono font-medium text-4xl ${scoreColor}`}
            style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
          >
            {score}%
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
            // SCORE
          </p>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm text-ops-text-primary">
            {summary}
          </p>
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
          // QUESTION BREAKDOWN
        </p>
        {feedback.map((qf) => {
          const question = questions.find((q) => q.id === qf.questionId);
          const fullCredit = qf.score === qf.maxPoints;
          const partial = qf.score > 0 && !fullCredit;
          const tone = fullCredit
            ? 'text-ops-success'
            : partial
              ? 'text-ops-warning'
              : 'text-ops-rose';

          return (
            <div key={qf.questionId} className="glass-surface p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <p className="font-body text-sm text-ops-text-primary">
                  {question?.question ?? qf.questionId}
                </p>
                <span
                  className={`shrink-0 font-mono text-[11px] ${tone}`}
                  style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                >
                  {qf.score}/{qf.maxPoints}
                </span>
              </div>
              <p className="font-body text-xs leading-relaxed text-ops-text-secondary">
                {qf.feedback}
              </p>
            </div>
          );
        })}
      </div>

      {/* Retake */}
      {onRetake && (
        <div className="flex items-center gap-4">
          <button
            onClick={onRetake}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-border px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:border-ops-border-hover hover:text-ops-text-primary"
          >
            RETAKE
          </button>
          {attemptsRemaining !== undefined && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
              {attemptsRemaining} {attemptsRemaining === 1 ? 'ATTEMPT' : 'ATTEMPTS'} REMAINING
            </span>
          )}
        </div>
      )}
    </div>
  );
}

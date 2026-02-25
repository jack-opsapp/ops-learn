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
        : 'text-ops-accent';

  const scoreBorderColor =
    score >= 80
      ? 'border-ops-success'
      : score >= 50
        ? 'border-ops-warning'
        : 'border-ops-accent';

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div
        className={`flex items-center gap-6 rounded-[3px] border ${scoreBorderColor} bg-ops-surface p-6`}
      >
        <div className="text-center">
          <p className={`font-heading text-4xl font-bold ${scoreColor}`}>
            {score}%
          </p>
          <p className="mt-1 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Score
          </p>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-light text-ops-text-primary">
            {score >= 80
              ? 'Great work! You have a solid understanding of this material.'
              : score >= 50
                ? 'Good effort. Review the feedback below to strengthen your understanding.'
                : 'Keep going. Review the material and try again when you\'re ready.'}
          </p>
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="space-y-4">
        <p className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
          Question Breakdown
        </p>
        {feedback.map((qf) => {
          const question = questions.find((q) => q.id === qf.questionId);
          return (
            <div
              key={qf.questionId}
              className="rounded-[3px] border border-ops-border bg-ops-surface p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <p className="font-body text-sm font-light text-ops-text-primary">
                  {question?.question ?? qf.questionId}
                </p>
                <span
                  className={`shrink-0 font-caption text-xs ${
                    qf.score === qf.maxPoints
                      ? 'text-ops-success'
                      : qf.score > 0
                        ? 'text-ops-warning'
                        : 'text-ops-accent'
                  }`}
                >
                  {qf.score}/{qf.maxPoints}
                </span>
              </div>
              <p className="font-body text-xs font-light leading-relaxed text-ops-text-secondary">
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
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ops-border px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-text-secondary transition-all duration-200 hover:border-ops-border-hover hover:text-ops-text-primary"
          >
            Retake
          </button>
          {attemptsRemaining !== undefined && (
            <span className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
              {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
            </span>
          )}
        </div>
      )}
    </div>
  );
}

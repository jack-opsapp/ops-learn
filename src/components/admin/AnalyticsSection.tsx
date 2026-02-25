import type { CourseAnalytics } from '@/lib/admin/types';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-ops-surface border border-ops-border rounded-[3px] px-5 py-4">
      <p className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-1">
        {label}
      </p>
      <p className="font-heading text-2xl font-bold text-ops-text-primary">
        {value}
      </p>
    </div>
  );
}

export default function AnalyticsSection({ analytics }: { analytics: CourseAnalytics }) {
  const { enrollment, lesson_progress, assessment_stats } = analytics;
  const hasData = enrollment.total > 0;
  const maxStarted = Math.max(...lesson_progress.map((l) => l.started_count), 1);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Enrolled" value={enrollment.total} />
        <StatCard label="Active" value={enrollment.active} />
        <StatCard label="Completed" value={enrollment.completed} />
        <StatCard label="Completion Rate" value={`${enrollment.completion_rate}%`} />
      </div>

      {!hasData && (
        <p className="font-body text-sm text-ops-text-secondary text-center py-8">
          No enrollment data yet.
        </p>
      )}

      {/* Drop-off funnel */}
      {hasData && lesson_progress.length > 0 && (
        <div>
          <h4 className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-4">
            Lesson Drop-off
          </h4>
          <div className="space-y-2">
            {lesson_progress.map((lp) => (
              <div key={lp.lesson_id} className="flex items-center gap-4">
                <span className="w-48 shrink-0 truncate font-body text-xs text-ops-text-secondary" title={lp.lesson_title}>
                  {lp.lesson_title}
                </span>
                <div className="flex-1 h-5 bg-ops-surface border border-ops-border rounded-[2px] overflow-hidden relative">
                  {/* Started bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-ops-accent/30"
                    style={{ width: `${(lp.started_count / maxStarted) * 100}%` }}
                  />
                  {/* Completed bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-ops-accent"
                    style={{ width: `${(lp.completed_count / maxStarted) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-caption text-[10px] text-ops-text-secondary">
                  {lp.completed_count}/{lp.started_count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 font-caption text-[10px] text-ops-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 bg-ops-accent rounded-[1px]" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 bg-ops-accent/30 rounded-[1px]" /> Started
            </span>
          </div>
        </div>
      )}

      {/* Assessment table */}
      {hasData && assessment_stats.length > 0 && (
        <div>
          <h4 className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-4">
            Assessment Performance
          </h4>
          <div className="border border-ops-border rounded-[3px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-ops-surface">
                  <th className="text-left px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">Assessment</th>
                  <th className="text-left px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">Type</th>
                  <th className="text-right px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">Submissions</th>
                  <th className="text-right px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">Pass Rate</th>
                  <th className="text-right px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {assessment_stats.map((a) => (
                  <tr key={a.assessment_id} className="border-t border-ops-border">
                    <td className="px-4 py-3 font-body text-sm text-ops-text-primary">{a.assessment_title}</td>
                    <td className="px-4 py-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">{a.type}</td>
                    <td className="px-4 py-3 text-right font-body text-sm text-ops-text-primary">{a.submission_count}</td>
                    <td className="px-4 py-3 text-right font-body text-sm text-ops-text-primary">{a.pass_rate}%</td>
                    <td className="px-4 py-3 text-right font-body text-sm text-ops-text-primary">{a.avg_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

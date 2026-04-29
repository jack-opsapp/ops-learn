interface ProgressBarProps {
  percent: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function ProgressBar({
  percent,
  size = 'sm',
  showLabel = false,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const heightClass = size === 'sm' ? 'h-[2px]' : 'h-1';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 overflow-hidden rounded-[2px] bg-ops-border ${heightClass}`}>
        <div
          className={`${heightClass} rounded-[2px] bg-ops-text-secondary transition-[width] duration-300`}
          style={{
            width: `${clampedPercent}%`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      {showLabel && (
        <span
          className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary"
          style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
        >
          {Math.round(clampedPercent)}%
        </span>
      )}
    </div>
  );
}

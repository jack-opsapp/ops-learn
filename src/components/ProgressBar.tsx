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
  const height = size === 'sm' ? 'h-1' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${height} w-full overflow-hidden rounded-full bg-ops-border`}
      >
        <div
          className={`${height} rounded-full bg-ops-accent transition-all duration-500`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 font-caption text-xs text-ops-text-tertiary">
          {Math.round(clampedPercent)}%
        </span>
      )}
    </div>
  );
}

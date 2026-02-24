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
      <div className={`flex-1 overflow-hidden rounded-full bg-ops-border ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full bg-ops-accent transition-all duration-500`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-caption text-[10px] tracking-[0.1em] text-ops-text-secondary">
          {Math.round(clampedPercent)}%
        </span>
      )}
    </div>
  );
}

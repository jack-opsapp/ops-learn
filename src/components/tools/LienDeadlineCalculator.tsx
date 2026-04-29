'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import LocationPicker, { useJurisdiction } from './LocationPicker';

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Parse a YYYY-MM-DD string from <input type="date"> as a local-time Date.
 * Avoids the UTC timezone shift that `new Date('YYYY-MM-DD')` causes (which
 * lands on the previous day in negative UTC offsets).
 */
function parseLocalDate(yyyymmdd: string): Date | null {
  const parts = yyyymmdd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function daysFromNow(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(value: number, country: 'CA' | 'US' | 'OTHER'): string {
  const symbol = country === 'US' ? '$' : country === 'CA' ? '$' : '$';
  const suffix = country === 'CA' ? ' CAD' : country === 'US' ? ' USD' : '';
  return `${symbol}${value.toLocaleString('en-US')}${suffix}`;
}

export default function LienDeadlineCalculator() {
  const [jurisdiction, setJurisdictionCode] = useJurisdiction();
  const todayString = new Date().toISOString().split('T')[0];
  const [lastWorkDate, setLastWorkDate] = useState<string>(todayString);

  const lienDeadline = useMemo(() => {
    if (!jurisdiction || !jurisdiction.lienFilingDays || !lastWorkDate) return null;
    const start = parseLocalDate(lastWorkDate);
    if (!start) return null;
    return addDays(start, jurisdiction.lienFilingDays);
  }, [jurisdiction, lastWorkDate]);

  const daysRemaining = lienDeadline ? daysFromNow(lienDeadline) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[5px] border border-ops-border bg-ops-background"
    >
      <div className="border-b border-ops-border px-6 py-5">
        <div className="mb-1 flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
            // INTERACTIVE TOOL
          </p>
        </div>
        <h3 className="font-heading text-lg font-medium text-ops-text-primary">
          Lien & Prompt-Payment Deadline Calculator
        </h3>
        <p className="mt-1.5 font-body text-sm font-normal text-ops-text-secondary">
          Pick your jurisdiction and the last day of work. The calculator surfaces your
          filing deadlines, prompt-payment rules, small claims limit, and deposit cap.
        </p>
      </div>

      <div className="flex flex-col gap-0 lg:flex-row">
        <div className="flex-1 space-y-4 border-b border-ops-border px-6 py-6 lg:border-b-0 lg:border-r">
          <p className="mb-2 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
            Your Inputs
          </p>

          <LocationPicker
            jurisdiction={jurisdiction}
            onChange={setJurisdictionCode}
          />

          <div>
            <label className="mb-1.5 block font-body text-sm font-normal text-ops-text-primary">
              Last Day of Work (or Substantial Completion)
            </label>
            <input
              type="date"
              value={lastWorkDate}
              onChange={(e) => setLastWorkDate(e.target.value)}
              className="w-full rounded-[5px] border border-ops-border bg-ops-surface px-3 py-2.5 font-body text-sm font-normal text-ops-text-primary focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
            />
          </div>
        </div>

        <div className="flex-1 px-6 py-6">
          <p className="mb-4 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
            Your Jurisdiction&apos;s Rules
          </p>

          {!jurisdiction ? (
            <div className="rounded-[5px] border border-dashed border-ops-border bg-ops-surface px-4 py-6 text-center">
              <p className="font-body text-sm font-normal text-ops-text-secondary">
                Select your jurisdiction to see deadlines.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lien Deadline */}
              <ResultCard
                label="Lien Filing Deadline"
                value={
                  lienDeadline
                    ? formatDateShort(lienDeadline)
                    : 'Not Available'
                }
                subValue={
                  daysRemaining !== null
                    ? daysRemaining > 0
                      ? `${daysRemaining} days from today`
                      : daysRemaining === 0
                        ? 'Today'
                        : `Deadline passed ${Math.abs(daysRemaining)} days ago`
                    : ''
                }
                highlight
                isUrgent={daysRemaining !== null && daysRemaining <= 14 && daysRemaining >= 0}
                isExpired={daysRemaining !== null && daysRemaining < 0}
                note={jurisdiction.lienNotes}
                detailLabel={
                  jurisdiction.lienFilingDays
                    ? `${jurisdiction.lienFilingDays} days from substantial completion`
                    : null
                }
              />

              {/* Prompt Payment */}
              <ResultCard
                label="Prompt Payment Window"
                value={
                  jurisdiction.promptPaymentDays
                    ? `${jurisdiction.promptPaymentDays} days`
                    : 'Not in force'
                }
                note={jurisdiction.promptPaymentNotes}
              />

              {/* Small Claims */}
              <ResultCard
                label="Small Claims Court Limit"
                value={
                  jurisdiction.smallClaimsLimit
                    ? formatCurrency(jurisdiction.smallClaimsLimit, jurisdiction.country)
                    : 'Varies'
                }
                note={jurisdiction.smallClaimsNotes}
              />

              {/* Deposit Cap */}
              <ResultCard
                label="Deposit Cap (Residential)"
                value={
                  jurisdiction.depositCapType === 'both'
                    ? `${jurisdiction.depositCapPercent}% or ${formatCurrency(jurisdiction.depositCapAbsolute ?? 0, jurisdiction.country)} (lesser)`
                    : jurisdiction.depositCapType === 'percentage'
                      ? `${jurisdiction.depositCapPercent}% max`
                      : jurisdiction.depositCapType === 'absolute'
                        ? formatCurrency(jurisdiction.depositCapAbsolute ?? 0, jurisdiction.country)
                        : 'No statutory cap'
                }
                note={jurisdiction.depositNotes}
              />

              <p className="pt-2 font-body text-xs italic font-normal text-ops-text-tertiary">
                General guidance only. Verify current rules with your jurisdiction&apos;s
                Land Title Office (Canada) or county recorder (US) and consult a lawyer
                before acting on a specific situation.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({
  label,
  value,
  subValue,
  note,
  detailLabel,
  highlight = false,
  isUrgent = false,
  isExpired = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  note: string;
  detailLabel?: string | null;
  highlight?: boolean;
  isUrgent?: boolean;
  isExpired?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[5px] border px-4 py-3 transition-colors duration-200 ${
        highlight
          ? isExpired
            ? 'border-[rgba(181,130,137,0.30)] bg-[rgba(181,130,137,0.12)]'
            : isUrgent
              ? 'border-[rgba(196,168,104,0.30)] bg-[rgba(196,168,104,0.12)]'
              : 'border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)]'
          : 'border-ops-border bg-ops-surface'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-body text-sm font-normal text-ops-text-secondary">
          {label}
        </span>
        <span
          className={`font-heading text-base font-medium tabular-nums ${
            highlight
              ? isExpired
                ? 'text-ops-rose'
                : isUrgent
                  ? 'text-ops-warning'
                  : 'text-ops-text-primary'
              : 'text-ops-text-primary'
          }`}
        >
          {value}
        </span>
      </div>
      {subValue && (
        <p
          className={`mt-1 font-body text-xs font-normal tabular-nums ${
            isExpired ? 'text-ops-rose' : isUrgent ? 'text-ops-warning' : 'text-ops-text-secondary'
          }`}
        >
          {subValue}
        </p>
      )}
      {detailLabel && (
        <p className="mt-1 font-body text-xs font-normal text-ops-text-tertiary">
          {detailLabel}
        </p>
      )}
      <p className="mt-2 font-body text-xs font-normal leading-relaxed text-ops-text-secondary">
        {note}
      </p>
    </motion.div>
  );
}

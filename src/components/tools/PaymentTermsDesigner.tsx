'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Milestone {
  id: string;
  label: string;
  trigger: string;
  percent: number;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'm1', label: 'On Signing', trigger: 'Contract signed, materials ordered', percent: 25 },
  { id: 'm2', label: 'Substrate Complete', trigger: 'Substrate work done, photographed, signed off', percent: 25 },
  { id: 'm3', label: 'Mid Install', trigger: 'Primary install complete, signed off', percent: 25 },
  { id: 'm4', label: 'On Completion', trigger: 'Final walk-through, all items signed off', percent: 20 },
  { id: 'm5', label: 'Holdback Released', trigger: '14 days after completion (deficiency period)', percent: 5 },
];

function formatCurrency(value: number): string {
  if (!isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default function PaymentTermsDesigner() {
  const [jobTotal, setJobTotal] = useState<string>('');
  const [costEstimate, setCostEstimate] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);

  const total = parseFloat(jobTotal) || 0;
  const cost = parseFloat(costEstimate) || 0;

  const totalPercent = useMemo(
    () => milestones.reduce((sum, m) => sum + (m.percent || 0), 0),
    [milestones],
  );

  const isValid = totalPercent === 100;

  const milestoneAmounts = useMemo(() => {
    return milestones.map((m) => ({
      ...m,
      amount: total * (m.percent / 100),
    }));
  }, [milestones, total]);

  // Cumulative cash position assuming costs are spread evenly across milestones.
  // Model: each phase's costs are incurred BEFORE that phase's milestone payment lands.
  // Final position equals total payments minus total cost = gross profit on the job.
  const cashPosition = useMemo(() => {
    if (!total || milestones.length === 0) return [];
    const costPerMilestone = cost / Math.max(milestones.length, 1);
    let runningCash = 0;
    return milestoneAmounts.map((m) => {
      runningCash -= costPerMilestone;
      runningCash += m.amount;
      return { id: m.id, label: m.label, position: runningCash };
    });
  }, [milestoneAmounts, cost, total, milestones.length]);

  const minCashPosition = cashPosition.length
    ? Math.min(...cashPosition.map((c) => c.position))
    : 0;

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { id: uid(), label: 'New Milestone', trigger: 'Define the verifiable event', percent: 0 },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const moveMilestone = (id: string, direction: 'up' | 'down') => {
    setMilestones((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

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
          Payment Terms Designer
        </h3>
        <p className="mt-1.5 font-body text-sm font-normal text-ops-text-secondary">
          Design milestone payments tied to verifiable events. Plug in your job total
          and estimated cost, then tune the milestone percentages until your cash
          position stays positive throughout the project.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-body text-sm font-normal text-ops-text-primary">
              Job Total
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-tertiary">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={jobTotal}
                onChange={(e) => setJobTotal(e.target.value)}
                placeholder="90000"
                className="w-full rounded-[5px] border border-ops-border bg-ops-surface py-2.5 pl-7 pr-3 font-body text-sm font-normal text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-body text-sm font-normal text-ops-text-primary">
              Estimated Total Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-tertiary">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={costEstimate}
                onChange={(e) => setCostEstimate(e.target.value)}
                placeholder="45000"
                className="w-full rounded-[5px] border border-ops-border bg-ops-surface py-2.5 pl-7 pr-3 font-body text-sm font-normal text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
              />
            </div>
          </div>
        </div>

        {/* Milestone editor */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
              Milestone Schedule
            </p>
            <span
              className={`font-caption text-[11px] uppercase tracking-wider tabular-nums ${
                isValid ? 'text-ops-success' : 'text-ops-warning'
              }`}
            >
              Total: {totalPercent}%
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {milestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[5px] border border-ops-border bg-ops-surface p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => updateMilestone(m.id, 'label', e.target.value)}
                          placeholder="Milestone label"
                          className="flex-1 rounded-[5px] border border-ops-border bg-ops-background px-3 py-1.5 font-body text-sm font-normal text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
                        />
                        <div className="relative w-24">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={m.percent || ''}
                            onChange={(e) =>
                              updateMilestone(m.id, 'percent', parseFloat(e.target.value) || 0)
                            }
                            placeholder="%"
                            className="w-full rounded-[5px] border border-ops-border bg-ops-background px-3 py-1.5 pr-7 font-body text-sm font-normal tabular-nums text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-ops-text-tertiary">
                            %
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={m.trigger}
                        onChange={(e) => updateMilestone(m.id, 'trigger', e.target.value)}
                        placeholder="Verifiable trigger event (be specific)"
                        className="w-full rounded-[5px] border border-ops-border bg-ops-background px-3 py-1.5 font-body text-xs font-normal text-ops-text-secondary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
                      />
                      {total > 0 && (
                        <p className="font-caption text-[11px] uppercase tracking-wider tabular-nums text-ops-text-primary">
                          {formatCurrency(total * (m.percent / 100))}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveMilestone(m.id, 'up')}
                        disabled={i === 0}
                        className="rounded-[4px] border border-ops-border px-2 py-1 font-caption text-[11px] text-ops-text-secondary transition-colors duration-200 hover:border-ops-border-hover hover:text-ops-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMilestone(m.id, 'down')}
                        disabled={i === milestones.length - 1}
                        className="rounded-[4px] border border-ops-border px-2 py-1 font-caption text-[11px] text-ops-text-secondary transition-colors duration-200 hover:border-ops-border-hover hover:text-ops-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        className="rounded-[4px] border border-ops-border px-2 py-1 font-caption text-[11px] text-ops-text-secondary transition-colors duration-200 hover:border-[rgba(181,130,137,0.50)] hover:text-ops-rose"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={addMilestone}
              className="w-full rounded-[5px] border border-dashed border-ops-border bg-transparent px-3 py-2 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-200 hover:border-ops-border-hover hover:text-ops-text-primary"
            >
              + Add Milestone
            </button>
          </div>
        </div>

        {/* Cash position summary */}
        {total > 0 && cost > 0 && isValid && (
          <div>
            <p className="mb-3 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
              Projected Cash Position After Each Milestone
            </p>
            <div className="space-y-1.5">
              {cashPosition.map(({ id, label, position }) => {
                const isNegative = position < 0;
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between rounded-[5px] border px-3 py-2 ${
                      isNegative
                        ? 'border-[rgba(181,130,137,0.30)] bg-[rgba(181,130,137,0.12)]'
                        : 'border-ops-border bg-ops-surface'
                    }`}
                  >
                    <span className="font-body text-xs font-normal text-ops-text-secondary">
                      {label}
                    </span>
                    <span
                      className={`font-heading text-sm font-medium tabular-nums ${
                        isNegative ? 'text-ops-rose' : 'text-ops-text-primary'
                      }`}
                    >
                      {formatCurrency(position)}
                    </span>
                  </div>
                );
              })}
            </div>
            {minCashPosition < 0 && (
              <p className="mt-3 font-body text-xs italic font-normal text-ops-rose">
                Your milestone schedule goes cash-negative at some point. Restructure
                the percentages so the early milestones cover materials and early
                costs before subsequent ones come due.
              </p>
            )}
          </div>
        )}

        {!isValid && totalPercent !== 0 && (
          <p className="font-body text-xs italic font-normal text-ops-warning">
            Milestone percentages must total 100% before the cash position projection
            can run. Currently at {totalPercent}%.
          </p>
        )}
      </div>
    </motion.div>
  );
}

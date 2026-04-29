'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const WEEK_COUNT = 13;

interface Row {
  id: string;
  label: string;
  type: 'in' | 'out';
  values: number[];
}

const DEFAULT_ROWS: Row[] = [
  // Inflows
  { id: 'deposits', label: 'Deposits', type: 'in', values: Array(WEEK_COUNT).fill(0) },
  { id: 'milestones', label: 'Milestone Payments', type: 'in', values: Array(WEEK_COUNT).fill(0) },
  { id: 'finals', label: 'Final Payments', type: 'in', values: Array(WEEK_COUNT).fill(0) },
  // Outflows
  { id: 'payroll', label: 'Payroll', type: 'out', values: Array(WEEK_COUNT).fill(0) },
  { id: 'suppliers', label: 'Suppliers', type: 'out', values: Array(WEEK_COUNT).fill(0) },
  { id: 'subs', label: 'Subcontractors', type: 'out', values: Array(WEEK_COUNT).fill(0) },
  { id: 'rent', label: 'Rent / Utilities', type: 'out', values: Array(WEEK_COUNT).fill(0) },
  { id: 'tax', label: 'Tax Remittances', type: 'out', values: Array(WEEK_COUNT).fill(0) },
];

function formatCurrency(value: number): string {
  if (!isFinite(value)) return '—';
  if (value === 0) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatBalance(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function CashFlowForecaster() {
  const [startingBalance, setStartingBalance] = useState<string>('');
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);

  const updateCell = (rowId: string, weekIndex: number, value: string) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, values: r.values.map((v, i) => (i === weekIndex ? num : v)) }
          : r,
      ),
    );
  };

  const weeklyTotals = useMemo(() => {
    const inflows = Array(WEEK_COUNT).fill(0);
    const outflows = Array(WEEK_COUNT).fill(0);

    for (const row of rows) {
      for (let i = 0; i < WEEK_COUNT; i++) {
        if (row.type === 'in') inflows[i] += row.values[i];
        else outflows[i] += row.values[i];
      }
    }

    const netByWeek = inflows.map((inAmt, i) => inAmt - outflows[i]);
    const start = parseFloat(startingBalance) || 0;
    const balanceByWeek: number[] = [];
    let runningBalance = start;
    for (const net of netByWeek) {
      runningBalance += net;
      balanceByWeek.push(runningBalance);
    }

    return { inflows, outflows, netByWeek, balanceByWeek };
  }, [rows, startingBalance]);

  const minBalance = Math.min(...weeklyTotals.balanceByWeek);
  const minBalanceWeek = weeklyTotals.balanceByWeek.indexOf(minBalance);
  const hasNegativeWeek = minBalance < 0;
  const hasAnyData =
    parseFloat(startingBalance) > 0 ||
    rows.some((r) => r.values.some((v) => v !== 0));

  const inflowRows = rows.filter((r) => r.type === 'in');
  const outflowRows = rows.filter((r) => r.type === 'out');

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
          13-Week Cash Flow Forecaster
        </h3>
        <p className="mt-1.5 font-body text-sm font-normal text-ops-text-secondary">
          Plug in your starting bank balance, then project inflows and outflows by
          week. The bottom row shows your projected bank balance at the end of each
          week — negative weeks tell you exactly when to act.
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="mb-4 max-w-xs">
          <label className="mb-1.5 block font-body text-sm font-normal text-ops-text-primary">
            Starting Bank Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-tertiary">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="25000"
              className="w-full rounded-[5px] border border-ops-border bg-ops-surface py-2.5 pl-7 pr-3 font-body text-sm font-normal text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
            />
          </div>
        </div>

        {hasNegativeWeek && hasAnyData && (
          <div className="mb-4 rounded-[5px] border border-[rgba(181,130,137,0.30)] bg-[rgba(181,130,137,0.12)] px-4 py-3">
            <p className="font-caption text-[11px] uppercase tracking-wider text-ops-rose">
              Cash Crunch Detected
            </p>
            <p className="mt-1 font-body text-sm font-normal text-ops-text-primary">
              Week {minBalanceWeek + 1} projects a negative balance of{' '}
              <span className="font-medium tabular-nums text-ops-rose">
                {formatBalance(minBalance)}
              </span>
              . Take action this week to prevent it.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-ops-background pb-3 pr-3 text-left font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
                  Category
                </th>
                {Array.from({ length: WEEK_COUNT }, (_, i) => (
                  <th
                    key={i}
                    className="px-1 pb-3 text-right font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary"
                  >
                    W{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Inflows section */}
              <tr>
                <td
                  colSpan={WEEK_COUNT + 1}
                  className="pb-1 pt-2 font-caption text-[11px] uppercase tracking-wider text-ops-success"
                >
                  Cash In
                </td>
              </tr>
              {inflowRows.map((row) => (
                <RowEditor
                  key={row.id}
                  row={row}
                  onUpdate={(weekIndex, val) => updateCell(row.id, weekIndex, val)}
                />
              ))}
              <SummaryRow
                label="Total Inflows"
                values={weeklyTotals.inflows}
                color="success"
              />

              {/* Outflows section */}
              <tr>
                <td
                  colSpan={WEEK_COUNT + 1}
                  className="pb-1 pt-4 font-caption text-[11px] uppercase tracking-wider text-ops-warning"
                >
                  Cash Out
                </td>
              </tr>
              {outflowRows.map((row) => (
                <RowEditor
                  key={row.id}
                  row={row}
                  onUpdate={(weekIndex, val) => updateCell(row.id, weekIndex, val)}
                />
              ))}
              <SummaryRow
                label="Total Outflows"
                values={weeklyTotals.outflows}
                color="warning"
              />

              {/* Net + Balance */}
              <tr>
                <td colSpan={WEEK_COUNT + 1} className="pt-4" />
              </tr>
              <SummaryRow label="Net Week" values={weeklyTotals.netByWeek} color="neutral" />
              <SummaryRow
                label="Bank Balance"
                values={weeklyTotals.balanceByWeek}
                color="balance"
                emphasized
              />
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function RowEditor({
  row,
  onUpdate,
}: {
  row: Row;
  onUpdate: (weekIndex: number, val: string) => void;
}) {
  return (
    <tr className="border-t border-ops-border/40">
      <td className="sticky left-0 z-10 bg-ops-background py-1 pr-3 font-body text-sm font-normal text-ops-text-primary">
        {row.label}
      </td>
      {row.values.map((val, i) => (
        <td key={i} className="px-0.5 py-1">
          <input
            type="number"
            inputMode="decimal"
            value={val === 0 ? '' : val}
            onChange={(e) => onUpdate(i, e.target.value)}
            placeholder="—"
            className="w-full min-w-[70px] rounded-[2px] border border-transparent bg-ops-surface/50 px-2 py-1 text-right font-body text-xs font-normal tabular-nums text-ops-text-primary placeholder:text-ops-text-mute hover:border-ops-border focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200"
          />
        </td>
      ))}
    </tr>
  );
}

function SummaryRow({
  label,
  values,
  color,
  emphasized = false,
}: {
  label: string;
  values: number[];
  color: 'success' | 'warning' | 'neutral' | 'balance';
  emphasized?: boolean;
}) {
  const colorClass = (val: number, isLabelCol = false) => {
    if (color === 'balance') {
      return val < 0 ? 'text-ops-rose' : 'text-ops-text-primary';
    }
    if (isLabelCol) {
      if (color === 'success') return 'text-ops-success';
      if (color === 'warning') return 'text-ops-warning';
      return 'text-ops-text-primary';
    }
    if (color === 'success') return val > 0 ? 'text-ops-success' : 'text-ops-text-secondary';
    if (color === 'warning') return val > 0 ? 'text-ops-warning' : 'text-ops-text-secondary';
    if (color === 'neutral') return val < 0 ? 'text-ops-rose' : val > 0 ? 'text-ops-success' : 'text-ops-text-secondary';
    return 'text-ops-text-primary';
  };

  return (
    <tr
      className={`border-t ${
        emphasized ? 'border-ops-accent/30' : 'border-ops-border'
      }`}
    >
      <td
        className={`sticky left-0 z-10 bg-ops-background py-2 pr-3 font-caption text-[11px] uppercase tracking-wider ${colorClass(0, true)}`}
      >
        {label}
      </td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`px-2 py-2 text-right font-heading ${
            emphasized ? 'text-sm font-medium' : 'text-xs font-normal'
          } tabular-nums ${colorClass(val)}`}
        >
          {color === 'balance' ? formatBalance(val) : formatCurrency(val)}
        </td>
      ))}
    </tr>
  );
}

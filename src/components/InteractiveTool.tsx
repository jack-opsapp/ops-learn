'use client';

import { useState, useMemo } from 'react';
import { evaluateFormula } from '@/lib/safe-math';

interface ToolInput {
  id: string;
  label: string;
  type: 'currency' | 'number' | 'percentage';
  placeholder?: string;
  default?: number;
}

interface ToolOutput {
  id: string;
  label: string;
  formula: string;
  format: 'currency' | 'number' | 'percentage';
  highlight?: boolean;
}

interface ToolConfig {
  tool_type: string;
  title: string;
  description: string;
  inputs: ToolInput[];
  outputs: ToolOutput[];
}

function formatOutput(value: number, format: 'currency' | 'number' | 'percentage'): string {
  if (!isFinite(value)) return '—';

  switch (format) {
    case 'currency':
      return value < 0
        ? `-$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

function getInputPrefix(type: ToolInput['type']): string | null {
  if (type === 'currency') return '$';
  return null;
}

function getInputSuffix(type: ToolInput['type']): string | null {
  if (type === 'percentage') return '%';
  return null;
}

export default function InteractiveTool({ config }: { config: ToolConfig }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const input of config.inputs) {
      initial[input.id] = input.default !== undefined ? String(input.default) : '';
    }
    return initial;
  });

  // Parse input values to numbers
  const numericValues = useMemo(() => {
    const nums: Record<string, number> = {};
    for (const input of config.inputs) {
      const raw = values[input.id] ?? '';
      nums[input.id] = raw === '' ? 0 : parseFloat(raw) || 0;
    }
    return nums;
  }, [values, config.inputs]);

  // Compute outputs (with dependency resolution — outputs can reference other outputs)
  const computedOutputs = useMemo(() => {
    const allVars = { ...numericValues };
    const results: Array<{ output: ToolOutput; value: number }> = [];

    for (const output of config.outputs) {
      const value = evaluateFormula(output.formula, allVars);
      allVars[output.id] = value;
      results.push({ output, value });
    }

    return results;
  }, [numericValues, config.outputs]);

  const hasAnyInput = Object.values(values).some((v) => v !== '' && v !== '0');

  return (
    <div className="rounded-[3px] border border-ops-border bg-ops-background">
      {/* Header */}
      <div className="border-b border-ops-border px-6 py-5">
        <p className="mb-1 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-accent">
          Interactive Tool
        </p>
        <h3 className="font-heading text-lg font-medium text-ops-text-primary">
          {config.title}
        </h3>
        <p className="mt-1.5 font-body text-sm font-light text-ops-text-secondary">
          {config.description}
        </p>
      </div>

      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Inputs */}
        <div className="flex-1 border-b border-ops-border px-6 py-6 lg:border-b-0 lg:border-r">
          <p className="mb-4 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Your Numbers
          </p>
          <div className="space-y-4">
            {config.inputs.map((input) => {
              const prefix = getInputPrefix(input.type);
              const suffix = getInputSuffix(input.type);

              return (
                <div key={input.id}>
                  <label className="mb-1.5 block font-body text-sm font-light text-ops-text-primary">
                    {input.label}
                  </label>
                  <div className="relative">
                    {prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-secondary/50">
                        {prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      inputMode="decimal"
                      value={values[input.id]}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [input.id]: e.target.value }))
                      }
                      placeholder={input.placeholder}
                      className={`w-full rounded-[3px] border border-ops-border bg-ops-surface py-2.5 font-body text-sm font-light text-ops-text-primary placeholder:text-ops-text-secondary/30 focus:border-ops-accent focus:outline-none ${
                        prefix ? 'pl-7 pr-3' : suffix ? 'pl-3 pr-7' : 'px-3'
                      }`}
                    />
                    {suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-secondary/50">
                        {suffix}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outputs */}
        <div className="flex-1 px-6 py-6">
          <p className="mb-4 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Results
          </p>
          <div className="space-y-3">
            {computedOutputs.map(({ output, value }) => {
              const formatted = hasAnyInput ? formatOutput(value, output.format) : '—';
              const isNegative = value < 0 && hasAnyInput;

              return (
                <div
                  key={output.id}
                  className={`flex items-center justify-between rounded-[3px] px-4 py-3 ${
                    output.highlight
                      ? 'border border-ops-accent/20 bg-ops-accent/[0.04]'
                      : 'border border-ops-border bg-ops-surface'
                  }`}
                >
                  <span className="font-body text-sm font-light text-ops-text-secondary">
                    {output.label}
                  </span>
                  <span
                    className={`font-heading text-lg font-medium tabular-nums ${
                      output.highlight
                        ? isNegative
                          ? 'text-red-400'
                          : 'text-ops-accent'
                        : isNegative
                          ? 'text-red-400'
                          : 'text-ops-text-primary'
                    }`}
                  >
                    {formatted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

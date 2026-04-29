'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { evaluateFormula } from '@/lib/safe-math';

interface ToolInput {
  id: string;
  label: string;
  type: 'currency' | 'number' | 'percentage';
  placeholder?: string;
  default?: number;
  group?: string;
}

interface ToolOutput {
  id: string;
  label: string;
  formula: string;
  format: 'currency' | 'number' | 'percentage';
  highlight?: boolean;
}

export interface FormulaToolConfig {
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

function groupInputs(inputs: ToolInput[]): { group: string | null; inputs: ToolInput[] }[] {
  const groups: { group: string | null; inputs: ToolInput[] }[] = [];
  let currentGroup: string | null | undefined = undefined;

  for (const input of inputs) {
    const group = input.group ?? null;
    if (group !== currentGroup) {
      groups.push({ group, inputs: [input] });
      currentGroup = group;
    } else {
      groups[groups.length - 1].inputs.push(input);
    }
  }

  return groups;
}

function InputField({
  input,
  value,
  onChange,
  compact = false,
}: {
  input: ToolInput;
  value: string;
  onChange: (val: string) => void;
  compact?: boolean;
}) {
  const prefix = getInputPrefix(input.type);
  const suffix = getInputSuffix(input.type);

  return (
    <div>
      <label
        className={`mb-1.5 block font-body font-normal text-ops-text-primary ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {input.label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-tertiary">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={input.placeholder}
          className={`w-full rounded-[5px] border border-ops-border bg-ops-surface font-body text-sm font-normal text-ops-text-primary placeholder:text-ops-text-mute focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-[border-color] duration-200 ${
            compact ? 'py-2' : 'py-2.5'
          } ${prefix ? 'pl-7 pr-3' : suffix ? 'pl-3 pr-7' : 'px-3'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-ops-text-tertiary">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FormulaTool({ config }: { config: FormulaToolConfig }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const input of config.inputs) {
      initial[input.id] = input.default !== undefined ? String(input.default) : '';
    }
    return initial;
  });

  const numericValues = useMemo(() => {
    const nums: Record<string, number> = {};
    for (const input of config.inputs) {
      const raw = values[input.id] ?? '';
      nums[input.id] = raw === '' ? 0 : parseFloat(raw) || 0;
    }
    return nums;
  }, [values, config.inputs]);

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
  const hasGroups = config.inputs.some((i) => i.group);
  const inputGroups = useMemo(() => groupInputs(config.inputs), [config.inputs]);
  const isLargeTool = config.inputs.length > 12;

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
          {config.title}
        </h3>
        <p className="mt-1.5 font-body text-sm font-normal text-ops-text-secondary">
          {config.description}
        </p>
      </div>

      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          className={`flex-1 border-b border-ops-border px-6 py-6 lg:border-b-0 lg:border-r ${
            isLargeTool ? 'lg:max-h-[640px] lg:overflow-y-auto' : ''
          }`}
        >
          <p className="mb-4 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
            Your Numbers
          </p>

          {hasGroups ? (
            <div className="space-y-6">
              {inputGroups.map((group, gi) => (
                <div key={group.group ?? gi}>
                  {group.group && (
                    <div className="mb-3 border-b border-ops-border/50 pb-2">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                        {group.group}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {group.inputs.map((input) => (
                      <InputField
                        key={input.id}
                        input={input}
                        value={values[input.id]}
                        onChange={(val) =>
                          setValues((prev) => ({ ...prev, [input.id]: val }))
                        }
                        compact={isLargeTool}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {config.inputs.map((input) => (
                <InputField
                  key={input.id}
                  input={input}
                  value={values[input.id]}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [input.id]: val }))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex-1 px-6 py-6 ${
            isLargeTool ? 'lg:max-h-[640px] lg:overflow-y-auto' : ''
          }`}
        >
          <p className="mb-4 font-caption text-[11px] uppercase tracking-wider text-ops-text-secondary">
            Results
          </p>
          <div className="space-y-2">
            {computedOutputs.map(({ output, value }, index) => {
              const formatted = hasAnyInput
                ? formatOutput(value, output.format)
                : '—';
              const isNegative = value < 0 && hasAnyInput;

              return (
                <motion.div
                  key={output.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`flex items-center justify-between rounded-[5px] px-4 py-3 transition-colors duration-150 ${
                    output.highlight
                      ? 'border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)]'
                      : 'border border-ops-border bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <span className="font-body text-sm font-normal text-ops-text-secondary">
                    {output.label}
                  </span>
                  <span
                    className={`font-mono text-lg font-medium transition-colors duration-150 ${
                      isNegative ? 'text-ops-rose' : 'text-ops-text-primary'
                    }`}
                    style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                  >
                    {formatted}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import { JURISDICTIONS, type Jurisdiction } from '@/lib/jurisdiction-data';

const STORAGE_KEY = 'ops-learn:jurisdiction';
const STORAGE_EVENT = 'ops-learn:jurisdiction-change';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    if (e instanceof StorageEvent && e.key !== STORAGE_KEY) return;
    callback();
  };
  window.addEventListener('storage', handler);
  window.addEventListener(STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

function getSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useJurisdiction(): [Jurisdiction | null, (code: string) => void] {
  const code = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setJurisdiction = (newCode: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, newCode);
    // Notify same-window subscribers (storage event only fires across windows)
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  const jurisdiction = code
    ? JURISDICTIONS.find((j) => j.code === code) ?? null
    : null;

  return [jurisdiction, setJurisdiction];
}

export default function LocationPicker({
  jurisdiction,
  onChange,
  compact = false,
}: {
  jurisdiction: Jurisdiction | null;
  onChange: (code: string) => void;
  compact?: boolean;
}) {
  const canadian = JURISDICTIONS.filter((j) => j.country === 'CA');
  const american = JURISDICTIONS.filter((j) => j.country === 'US');
  const other = JURISDICTIONS.filter((j) => j.country === 'OTHER');

  return (
    <div>
      <label
        className={`mb-1.5 block font-body font-normal text-ops-text-primary ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        Your Jurisdiction
      </label>
      <select
        value={jurisdiction?.code ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[44px] rounded-[5px] border border-ops-border bg-[rgba(255,255,255,0.04)] font-body font-normal text-ops-text-primary focus:border-[rgba(255,255,255,0.20)] focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-ops-accent focus-visible:outline-offset-2 transition-colors duration-150 ${
          compact ? 'py-2 px-3 text-xs' : 'py-2.5 px-3 text-sm'
        }`}
      >
        <option value="" disabled>
          Select your province or state…
        </option>
        <optgroup label="Canada">
          {canadian.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="United States">
          {american.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Other">
          {other.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

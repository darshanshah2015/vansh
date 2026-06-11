import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const controlClass = cn(
  'h-11 w-full rounded-md border border-border bg-background pl-3 pr-8 text-sm',
  'appearance-none cursor-pointer',
  'transition-colors duration-150',
  'hover:border-primary/50 hover:bg-secondary/30',
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
);

interface DateOfBirthPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

function SelectWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function DateOfBirthPicker({ value, onChange }: DateOfBirthPickerProps) {
  const { day, month, year } = useMemo(() => {
    if (!value) return { day: '', month: '', year: '' };
    const [y, m, d] = value.split('-');
    return { day: d ? String(parseInt(d)) : '', month: m ? String(parseInt(m)) : '', year: y || '' };
  }, [value]);

  const currentYear = new Date().getFullYear();
  const [yearInput, setYearInput] = useState(year);

  useEffect(() => {
    setYearInput(year);
  }, [year]);

  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }, [month, year]);

  const days = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth]);

  const update = (part: 'day' | 'month' | 'year', val: string) => {
    const d = part === 'day' ? val : day;
    const m = part === 'month' ? val : month;
    const y = part === 'year' ? val : year;

    if (!d && !m && !y) {
      onChange('');
    } else if (y) {
      onChange(`${y}-${(m || '01').padStart(2, '0')}-${(d || '01').padStart(2, '0')}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="rounded-md border border-border bg-secondary/20 p-2">
      <div className="grid grid-cols-[1.2fr_1fr_0.85fr] gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Year
          </label>
          <input
            value={yearInput}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 4);
              setYearInput(next);
              if (next.length === 4 || next.length === 0) {
                update('year', next);
              }
            }}
            inputMode="numeric"
            placeholder="YYYY"
            min="1800"
            max={currentYear}
            className={cn(
              'h-11 w-full rounded-md border border-border bg-background px-3 text-sm transition-colors',
              'hover:border-primary/50 hover:bg-secondary/30',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              !year && 'text-muted-foreground'
            )}
            aria-label="Year"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Month
          </label>
          <SelectWrapper>
            <select
              value={month}
              onChange={(e) => update('month', e.target.value)}
              className={cn(controlClass, !month && 'text-muted-foreground')}
              aria-label="Month"
            >
              <option value="">Month</option>
              {months.map((m, i) => (
                <option key={m} value={String(i + 1)}>{m.slice(0, 3)}</option>
              ))}
            </select>
          </SelectWrapper>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Day
          </label>
          <SelectWrapper>
            <select
              value={day}
              onChange={(e) => update('day', e.target.value)}
              className={cn(controlClass, !day && 'text-muted-foreground')}
              aria-label="Day"
            >
              <option value="">Day</option>
              {days.map((d) => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </SelectWrapper>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[currentYear - 25, currentYear - 50, currentYear - 75, 1900, 1800].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => update('year', String(preset))}
            className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

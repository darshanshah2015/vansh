import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const selectClass = cn(
  'h-10 w-full rounded-md border border-border bg-background pl-3 pr-8 text-sm',
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

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1900; y--) arr.push(y);
    return arr;
  }, [currentYear]);

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
    if (d && m && y) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    } else if (!d && !m && !y) {
      onChange('');
    } else {
      const parts = [
        y || '0000',
        (m || '01').padStart(2, '0'),
        (d || '01').padStart(2, '0'),
      ];
      onChange(parts.join('-'));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <SelectWrapper>
        <select
          value={day}
          onChange={(e) => update('day', e.target.value)}
          className={cn(selectClass, !day && 'text-muted-foreground')}
          aria-label="Day"
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
      </SelectWrapper>
      <SelectWrapper>
        <select
          value={month}
          onChange={(e) => update('month', e.target.value)}
          className={cn(selectClass, !month && 'text-muted-foreground')}
          aria-label="Month"
        >
          <option value="">Month</option>
          {months.map((m, i) => (
            <option key={m} value={String(i + 1)}>{m.slice(0, 3)}</option>
          ))}
        </select>
      </SelectWrapper>
      <SelectWrapper>
        <select
          value={year}
          onChange={(e) => update('year', e.target.value)}
          className={cn(selectClass, !year && 'text-muted-foreground')}
          aria-label="Year"
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </SelectWrapper>
    </div>
  );
}

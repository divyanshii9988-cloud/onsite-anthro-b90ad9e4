import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
};

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 15 Days', days: 15 },
  { label: 'Last 1 Month', days: 30 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.to);
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (label: string, days: number) => {
    const to = endOfDay(new Date());
    const from = days === 0 ? startOfDay(new Date()) : startOfDay(subDays(new Date(), days));
    onChange({ from, to, label });
    setOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({
        from: startOfDay(customFrom),
        to: endOfDay(customTo),
        label: `${format(customFrom, 'dd MMM')} - ${format(customTo, 'dd MMM yyyy')}`,
      });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{value.label}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.label, preset.days)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                  value.label === preset.label ? 'bg-primary/10 text-primary font-medium' : ''
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                showCustom ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Calendar */}
          {showCustom && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">From</p>
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={setCustomFrom}
                    initialFocus
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">To</p>
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={setCustomTo}
                    className="rounded-md border"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCustomApply} disabled={!customFrom || !customTo}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getDefaultDateRange(): DateRange {
  return {
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
    label: 'Today',
  };
}

export function filterByDateRange<T extends { createdAt?: Date; collectedAt?: Date; departureTime?: Date; appointmentDate?: Date; sentAt?: Date; registeredAt?: Date }>(
  items: T[],
  dateRange: DateRange,
  dateField: keyof T = 'createdAt' as keyof T
): T[] {
  return items.filter((item) => {
    const dateValue = item[dateField];
    if (!dateValue) return true;
    const itemDate = new Date(dateValue as Date);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  });
}

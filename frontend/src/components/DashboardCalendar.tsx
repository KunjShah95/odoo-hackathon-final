import React, { useMemo, useState } from 'react';
import { Trip } from '../types';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function inRange(d: Date, start: Date, end: Date) { const x = d.getTime(); return x >= start.getTime() && x <= end.getTime(); }

export default function DashboardCalendar({ trips }: { trips: Trip[] }) {
  const [viewDate, setViewDate] = useState(startOfMonth(new Date()));
  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const days: Date[] = useMemo(() => {
    const firstDayIndex = monthStart.getDay(); // 0=Sun
    const gridStart = addDays(monthStart, -firstDayIndex);
    const totalCells = 42; // 6 weeks grid
    return Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));
  }, [monthStart]);

  const parsedTrips = useMemo(() => (trips || []).map(t => ({
    ...t,
    _start: new Date(t.startDate),
    _end: new Date(t.endDate),
  })), [trips]);

  const today = new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth()-1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewDate(startOfMonth(new Date()))}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth()+1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === viewDate.getMonth();
          const dayTrips = parsedTrips.filter(t => inRange(d, t._start, t._end));
          const isToday = isSameDay(d, today);
          return (
            <div key={idx} className={`min-h-[72px] border rounded-lg p-1 ${inMonth ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-400' : ''}`}>
              <div className={`text-xs text-right ${inMonth ? 'text-gray-700' : 'text-gray-400'}`}>{d.getDate()}</div>
              <div className="mt-1 space-y-1">
                {dayTrips.slice(0,3).map(t => (
                  <div key={t.id} className="truncate text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                    {t.name}
                  </div>
                ))}
                {dayTrips.length > 3 && (
                  <div className="text-[10px] text-gray-500">+{dayTrips.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

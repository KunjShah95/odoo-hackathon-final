import React, { useEffect, useMemo, useState } from 'react';
import { Trip } from '../types';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { updateTrip as apiUpdateTrip, getTrips as apiGetTrips } from '../utils/api';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function inRange(d: Date, start: Date, end: Date) { const x = d.getTime(); return x >= start.getTime() && x <= end.getTime(); }

export default function DashboardCalendar({ trips }: { trips: Trip[] }) {
  const [viewDate, setViewDate] = useState(startOfMonth(new Date()));
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const days: Date[] = useMemo(() => {
    const firstDayIndex = monthStart.getDay(); // 0=Sun
    const gridStart = addDays(monthStart, -firstDayIndex);
    const totalCells = 42; // 6 weeks grid
    return Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));
  }, [monthStart]);

  useEffect(() => { setLocalTrips(trips || []); }, [trips]);

  const parsedTrips = useMemo(() => (localTrips || []).map(t => ({
    ...t,
    _start: new Date(t.startDate),
    _end: new Date(t.endDate),
  })), [localTrips]);

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
            <div
              key={idx}
              className={`min-h-[72px] border rounded-lg p-1 ${inMonth ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-400' : ''} cursor-pointer`}
              onClick={() => {
                setSelectedDate(d);
                setModalOpen(true);
                setError(null);
              }}
            >
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

      {/* Day details modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Day Details'}
            </DialogTitle>
          </DialogHeader>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {(() => {
              const day = selectedDate;
              const tripsOnDay = day ? parsedTrips.filter(t => inRange(day, t._start, t._end)) : [];
              if (!tripsOnDay.length) {
                return <div className="text-sm text-gray-600">No trips scheduled for this day.</div>;
              }
              return tripsOnDay.map(t => (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <div><span className="font-medium">Dates:</span> {t._start.toDateString()} → {t._end.toDateString()} ({Math.max(1, Math.round((t._end.getTime()-t._start.getTime())/86400000)+1)} days)</div>
                      {t.description && <div className="mt-1">{t.description}</div>}
                      <div className="mt-1"><span className="font-medium">Cities:</span> {t.cities?.length || 0}</div>
                      <div className="mt-1"><span className="font-medium">Budget (sum):</span> ${Number(t.totalCost || 0).toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Start date</label>
                        <Input type="date" defaultValue={t.startDate?.slice(0,10)} onChange={(e) => { (t as any)._editStart = e.target.value; }} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End date</label>
                        <Input type="date" defaultValue={t.endDate?.slice(0,10)} onChange={(e) => { (t as any)._editEnd = e.target.value; }} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `/trip/${t.id}/view`}>Open trip</Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              setError(null);
                              setSavingId(t.id);
                              const start = (t as any)._editStart || t.startDate?.slice(0,10);
                              const end = (t as any)._editEnd || t.endDate?.slice(0,10);
                              if (!start || !end) throw new Error('Both dates are required');
                              const token = localStorage.getItem('token');
                              if (!token) throw new Error('Not authenticated');
                              const updated = await apiUpdateTrip(t.id, { startDate: start, endDate: end }, token);
                              // Update local state to reflect new dates immediately
                              setLocalTrips(prev => prev.map(x => x.id === t.id ? { ...x, startDate: updated.startDate || start, endDate: updated.endDate || end } : x));
                            } catch (e:any) {
                              setError(e?.message || 'Failed to save dates');
                            } finally {
                              setSavingId(null);
                            }
                          }}
                          disabled={savingId === t.id}
                        >
                          {savingId === t.id ? 'Saving…' : 'Save dates'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

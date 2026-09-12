import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { formatFriendlyDate, formatFullDate, getTodayString, shiftDate } from '../utils/dateUtils';
import { Task } from '../types';

interface DateNavigatorProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  tasks: Task[];
  onOpenChat: () => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onSelectDate,
  tasks,
  onOpenChat,
}) => {
  const todayStr = getTodayString();
  const yesterdayStr = shiftDate(todayStr, -1);
  const tomorrowStr = shiftDate(todayStr, 1);

  // Generate 7 days around the current selection
  const daysWindow: string[] = [];
  for (let i = -3; i <= 3; i++) {
    daysWindow.push(shiftDate(currentDate, i));
  }

  // Count completion for each day
  const getDayStats = (dateStr: string) => {
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    return {
      total: dayTasks.length,
      completed,
      hasPending: dayTasks.length > 0 && completed < dayTasks.length,
    };
  };

  const isToday = currentDate === todayStr;
  const isYesterday = currentDate === yesterdayStr;
  const isPast = currentDate < todayStr;

  return (
    <div id="date-navigator-container" className="bg-white border-b border-stone-200 sticky top-0 z-20 backdrop-blur-md bg-white/95">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar: Full date heading & primary controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                id="btn-prev-day"
                onClick={() => onSelectDate(shiftDate(currentDate, -1))}
                className="p-1.5 rounded-md hover:bg-white text-stone-700 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-next-day"
                onClick={() => onSelectDate(shiftDate(currentDate, 1))}
                className="p-1.5 rounded-md hover:bg-white text-stone-700 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 id="current-date-title" className="text-xl font-bold text-stone-900 tracking-tight">
                  {formatFriendlyDate(currentDate)}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    Current Day
                  </span>
                )}
                {isYesterday && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    Previous Day Review
                  </span>
                )}
                {isPast && !isYesterday && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                    Archive View
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">{formatFullDate(currentDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                id="btn-jump-today"
                onClick={() => onSelectDate(todayStr)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return to Today
              </button>
            )}

            {/* Date input picker */}
            <div className="relative">
              <label htmlFor="calendar-date-picker" className="sr-only">Choose Date</label>
              <input
                id="calendar-date-picker"
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              />
              <button
                id="btn-calendar-picker"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Calendar</span>
              </button>
            </div>

            <button
              id="btn-ask-gemini-review"
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Review</span>
            </button>
          </div>
        </div>

        {/* Days carousel strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {daysWindow.map((dateStr) => {
            const isSelected = dateStr === currentDate;
            const stats = getDayStats(dateStr);
            const isDayToday = dateStr === todayStr;
            const isDayYesterday = dateStr === yesterdayStr;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();

            return (
              <button
                key={dateStr}
                id={`day-pill-${dateStr}`}
                onClick={() => onSelectDate(dateStr)}
                className={`flex-1 min-w-[62px] py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                    : isDayToday
                    ? 'bg-emerald-50/70 border-emerald-300 text-stone-900 hover:bg-emerald-100/70'
                    : isDayYesterday
                    ? 'bg-amber-50/70 border-amber-300 text-stone-800 hover:bg-amber-100/70'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span
                  className={`text-[11px] font-medium uppercase tracking-wider ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {isDayToday ? 'Today' : isDayYesterday ? 'Yest' : dayName}
                </span>
                <span className={`text-base font-bold ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                  {dayNum}
                </span>

                {/* Micro indicators for tasks */}
                <div className="flex items-center gap-1 mt-1 h-2">
                  {stats.total > 0 ? (
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-emerald-400'
                            : stats.completed === stats.total
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={`text-[9px] font-mono leading-none ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-stone-200" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

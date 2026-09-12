import React from 'react';
import { ArrowRight, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { formatFriendlyDate, getTodayString } from '../utils/dateUtils';
import { Task } from '../types';

interface PreviousDayReviewBannerProps {
  currentDate: string;
  tasksForCurrentDate: Task[];
  onRolloverAllToToday: () => void;
  onRolloverSingleToToday: (task: Task) => void;
}

export const PreviousDayReviewBanner: React.FC<PreviousDayReviewBannerProps> = ({
  currentDate,
  tasksForCurrentDate,
  onRolloverAllToToday,
}) => {
  const todayStr = getTodayString();
  const isPast = currentDate < todayStr;

  if (!isPast) {
    return null;
  }

  const completedTasks = tasksForCurrentDate.filter((t) => t.completed);
  const pendingTasks = tasksForCurrentDate.filter((t) => !t.completed);
  const total = tasksForCurrentDate.length;
  const completionPercentage = total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;

  return (
    <div
      id="previous-day-review-banner"
      className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/70 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-amber-950">
                Reviewing Past Tasks: {formatFriendlyDate(currentDate)}
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900">
                {completedTasks.length} of {total} completed ({completionPercentage}%)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-1">
              {pendingTasks.length > 0
                ? `${pendingTasks.length} ${
                    pendingTasks.length === 1 ? 'task was' : 'tasks were'
                  } not completed on this date. You can roll them over into Today's to-do list.`
                : 'All scheduled tasks for this day were finished! Outstanding work.'}
            </p>
          </div>
        </div>

        {pendingTasks.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-rollover-all-today"
              onClick={onRolloverAllToToday}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Roll Over {pendingTasks.length} Pending to Today</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mini preview of what was accomplished vs left pending */}
      <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Completed: {completedTasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-900">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Unfinished: {pendingTasks.length} tasks</span>
        </div>
      </div>
    </div>
  );
};

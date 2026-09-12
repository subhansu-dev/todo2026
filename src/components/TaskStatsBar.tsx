import React from 'react';
import { CheckCircle2, Circle, Clock, Filter, Search } from 'lucide-react';
import { Category, Task } from '../types';

interface TaskStatsBarProps {
  tasks: Task[];
  filterStatus: 'all' | 'active' | 'completed';
  setFilterStatus: (status: 'all' | 'active' | 'completed') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TaskStatsBar: React.FC<TaskStatsBarProps> = ({
  tasks,
  filterStatus,
  setFilterStatus,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = total - completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div id="task-stats-bar" className="mb-6 space-y-3">
      {/* Progress & Quick Stats Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Daily Progress
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                {completedCount} of {total} Done ({percentage}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <span>{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{completedCount} Completed</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Controls: Search, Filters & Categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-800 placeholder-stone-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterStatus === 'active'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterStatus === 'completed'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Done ({completedCount})
          </button>
        </div>

        {/* Category filter */}
        <div className="relative shrink-0">
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-800 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
            <option value="learning">Learning</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
};

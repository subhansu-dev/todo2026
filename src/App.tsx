/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Filter,
  History,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Category, Priority, Task } from './types';
import { getInitialTasks } from './data/seedData';
import { DateNavigator } from './components/DateNavigator';
import { PreviousDayReviewBanner } from './components/PreviousDayReviewBanner';
import { TaskStatsBar } from './components/TaskStatsBar';
import { TaskItem } from './components/TaskItem';
import { TaskModal } from './components/TaskModal';
import { ImageGeneratorModal } from './components/ImageGeneratorModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { formatFriendlyDate, getTodayString } from './utils/dateUtils';

const STORAGE_KEY = 'daily_tasks_app_items_v1';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return getInitialTasks();
  });

  const [currentDate, setCurrentDate] = useState<string>(getTodayString);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageTargetTask, setImageTargetTask] = useState<Task | null>(null);

  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const [viewingImage, setViewingImage] = useState<{
    url: string;
    prompt?: string;
    size?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to persist tasks', e);
    }
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Task Operations
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => {
    if (taskId) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...taskData } : t))
      );
      showToast('Task updated successfully.');
    } else {
      // Create new
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast('New task added.');
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted.');
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  // Roll over operations for reviewing previous days
  const handleRolloverSingleToToday = (task: Task) => {
    const todayStr = getTodayString();
    if (task.date === todayStr) return;

    // Move task to today and record original date
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              date: todayStr,
              rolledOverFrom: task.date,
            }
          : t
      )
    );
    showToast(`"${task.title}" rolled over to Today.`);
  };

  const handleRolloverAllToToday = () => {
    const todayStr = getTodayString();
    const pendingOnSelectedDate = tasks.filter(
      (t) => t.date === currentDate && !t.completed
    );

    if (pendingOnSelectedDate.length === 0) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.date === currentDate && !t.completed) {
          return {
            ...t,
            date: todayStr,
            rolledOverFrom: currentDate,
          };
        }
        return t;
      })
    );

    showToast(`Rolled over ${pendingOnSelectedDate.length} pending tasks to Today.`);
  };

  // Image Generation Handlers
  const handleOpenImageGenForTask = (task: Task) => {
    setImageTargetTask(task);
    setIsImageModalOpen(true);
  };

  const handleOpenStandaloneImageGen = () => {
    setImageTargetTask(null);
    setIsImageModalOpen(true);
  };

  const handleApplyImageToTask = (
    taskId: string,
    imageUrl: string,
    prompt: string,
    imageSize: '1K' | '2K' | '4K'
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              imageUrl,
              imagePrompt: prompt,
              imageSize,
            }
          : t
      )
    );
    showToast(`High-resolution (${imageSize}) visual attached to task.`);
  };

  // Chatbot task suggestion handler
  const handleAddTaskFromChat = (suggested: {
    title: string;
    priority?: Priority;
    category?: string;
    dueTime?: string;
  }) => {
    const todayStr = getTodayString();
    const newTask: Task = {
      id: `task-ai-${Date.now()}`,
      title: suggested.title,
      date: currentDate || todayStr,
      completed: false,
      priority: suggested.priority || 'medium',
      category: (suggested.category?.toLowerCase() as Category) || 'work',
      dueTime: suggested.dueTime,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Added AI suggested task: "${suggested.title}"`);
  };

  // Filter tasks for the active view date
  const tasksForCurrentDate = tasks.filter((t) => t.date === currentDate);

  const filteredTasks = tasksForCurrentDate.filter((t) => {
    // Status filter
    if (filterStatus === 'active' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;

    // Category filter
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      const matchCat = t.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  const isToday = currentDate === getTodayString();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-stone-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Bar */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 tracking-tight">
                Daily Tasks & Review
              </h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Day-by-day task tracker, historical review & AI assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-image-studio"
              onClick={handleOpenStandaloneImageGen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200"
              title="Generate Task Visual (1K / 2K / 4K)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Image Studio</span>
              <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                4K
              </span>
            </button>

            <button
              id="btn-open-gemini-chat"
              onClick={() => setIsChatDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Gemini Copilot</span>
            </button>

            <button
              id="btn-add-new-task-header"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Date Navigator with Carousel & Historical Indicators */}
      <DateNavigator
        currentDate={currentDate}
        onSelectDate={(newDate) => setCurrentDate(newDate)}
        tasks={tasks}
        onOpenChat={() => setIsChatDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Previous Day Review Banner if on past date */}
        <PreviousDayReviewBanner
          currentDate={currentDate}
          tasksForCurrentDate={tasksForCurrentDate}
          onRolloverAllToToday={handleRolloverAllToToday}
          onRolloverSingleToToday={handleRolloverSingleToToday}
        />

        {/* Task Stats Bar (Completion Progress, Filters, Categories, Search) */}
        <TaskStatsBar
          tasks={tasksForCurrentDate}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Task List */}
        <div className="space-y-3" id="task-list-container">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onGenerateImage={handleOpenImageGenForTask}
                onRolloverToToday={handleRolloverSingleToToday}
                onViewImage={(url, prompt, size) =>
                  setViewingImage({ url, prompt, size })
                }
              />
            ))
          ) : (
            <div
              id="empty-tasks-state"
              className="py-16 px-4 rounded-2xl border border-dashed border-stone-300 bg-white/70 text-center flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">
                {tasksForCurrentDate.length === 0
                  ? `No tasks scheduled for ${formatFriendlyDate(currentDate)}`
                  : 'No tasks match your active filters'}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                {tasksForCurrentDate.length === 0
                  ? isToday
                    ? 'Start your day right by adding your first to-do item or planning with Gemini.'
                    : 'Use the button below to add tasks for this date or review adjacent days.'
                  : 'Try clearing the search query or changing your status filter.'}
              </p>

              <div className="flex items-center gap-2 mt-4">
                <button
                  id="btn-empty-add-task"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task for {formatFriendlyDate(currentDate)}</span>
                </button>

                <button
                  onClick={() => setIsChatDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plan with Gemini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Task on Mobile */}
      <button
        id="btn-floating-add-task"
        onClick={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-stone-900 hover:bg-stone-800 text-white rounded-full shadow-xl flex items-center justify-center z-30 transition-transform active:scale-95"
        aria-label="Add Task"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDate={currentDate}
      />

      <ImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageTargetTask(null);
        }}
        targetTask={imageTargetTask}
        onApplyImageToTask={handleApplyImageToTask}
      />

      <ImageViewerModal
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
        imageUrl={viewingImage?.url || null}
        prompt={viewingImage?.prompt}
        size={viewingImage?.size}
      />

      <GeminiChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        tasks={tasks}
        currentDate={currentDate}
        onAddTaskFromSuggestion={handleAddTaskFromChat}
      />
    </div>
  );
}

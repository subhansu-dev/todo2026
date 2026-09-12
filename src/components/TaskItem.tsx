import React from 'react';
import {
  Camera,
  Check,
  Clock,
  Edit3,
  Image as ImageIcon,
  MoveRight,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Task } from '../types';
import { getTodayString } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onGenerateImage: (task: Task) => void;
  onRolloverToToday: (task: Task) => void;
  onViewImage: (imageUrl: string, prompt?: string, size?: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  onGenerateImage,
  onRolloverToToday,
  onViewImage,
}) => {
  const todayStr = getTodayString();
  const isPast = task.date < todayStr;
  const isRolledOver = !!task.rolledOverFrom;

  const priorityStyles = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const categoryColors: Record<string, string> = {
    work: 'bg-blue-50 text-blue-700 border-blue-200',
    personal: 'bg-purple-50 text-purple-700 border-purple-200',
    health: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    learning: 'bg-amber-50 text-amber-700 border-amber-200',
    finance: 'bg-teal-50 text-teal-700 border-teal-200',
    other: 'bg-stone-50 text-stone-700 border-stone-200',
  };

  return (
    <div
      id={`task-item-${task.id}`}
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${
        task.completed
          ? 'bg-stone-50/70 border-stone-200 opacity-80'
          : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          id={`btn-toggle-task-${task.id}`}
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-stone-300 hover:border-emerald-500 bg-white'
          }`}
          aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold leading-snug break-words ${
                task.completed ? 'line-through text-stone-400' : 'text-stone-900'
              }`}
            >
              {task.title}
            </h4>

            {/* Action buttons on hover / mobile always accessible */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {isPast && !task.completed && (
                <button
                  id={`btn-rollover-task-${task.id}`}
                  onClick={() => onRolloverToToday(task)}
                  className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Move to Today's Tasks"
                >
                  <MoveRight className="w-4 h-4" />
                </button>
              )}

              <button
                id={`btn-generate-image-task-${task.id}`}
                onClick={() => onGenerateImage(task)}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Generate Task Concept Visual (1K/2K/4K)"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                id={`btn-edit-task-${task.id}`}
                onClick={() => onEdit(task)}
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                title="Edit Task"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                id={`btn-delete-task-${task.id}`}
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 leading-relaxed break-words ${
                task.completed ? 'text-stone-400 line-through' : 'text-stone-600'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Attached or Generated Image Thumbnail if present */}
          {task.imageUrl && (
            <div className="mt-3 relative inline-block group/img">
              <div
                onClick={() => onViewImage(task.imageUrl!, task.imagePrompt, task.imageSize)}
                className="relative rounded-xl overflow-hidden border border-stone-200 cursor-pointer shadow-xs max-w-[240px] max-h-[140px] bg-stone-100"
              >
                <img
                  src={task.imageUrl}
                  alt={task.imagePrompt || task.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover/img:opacity-100 text-[11px] font-medium text-white bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-xs shadow-sm">
                    View Full Size
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-500 font-medium">
                {task.imageSource === 'camera' ? (
                  <>
                    <Camera className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Camera Photo</span>
                  </>
                ) : task.imageSource === 'upload' ? (
                  <>
                    <UploadCloud className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-700">Attached File</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3 text-indigo-500" />
                    <span>AI Concept Art</span>
                    {task.imageSize && (
                      <span className="px-1 py-0.2 bg-stone-100 border border-stone-200 rounded font-mono text-[9px]">
                        {task.imageSize}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Badges and metadata row */}
          <div className="flex items-center gap-2 flex-wrap mt-2.5 pt-2 border-t border-stone-100 text-xs">
            {/* Priority */}
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${
                priorityStyles[task.priority] || priorityStyles.low
              }`}
            >
              {task.priority} Priority
            </span>

            {/* Category */}
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${
                categoryColors[task.category] || categoryColors.other
              }`}
            >
              <Tag className="w-3 h-3" />
              {task.category}
            </span>

            {/* Due Time */}
            {task.dueTime && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-600 bg-stone-100 border border-stone-200">
                <Clock className="w-3 h-3 text-stone-500" />
                {task.dueTime}
              </span>
            )}

            {/* Rolled over badge */}
            {isRolledOver && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Carried over from {task.rolledOverFrom}
              </span>
            )}

            {/* Past indicator */}
            {isPast && !task.completed && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Unfinished in past
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

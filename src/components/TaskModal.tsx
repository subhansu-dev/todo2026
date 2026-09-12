import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Task, Priority, Category } from '../types';
import { TaskPhotoAttachment } from './TaskPhotoAttachment';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => void;
  initialTask?: Task | null;
  defaultDate: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [dueTime, setDueTime] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageSource, setImageSource] = useState<'upload' | 'camera' | 'gemini' | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDate(initialTask.date);
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
      setDueTime(initialTask.dueTime || '');
      setImageUrl(initialTask.imageUrl);
      setImageSource(initialTask.imageSource);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate);
      setPriority('medium');
      setCategory('work');
      setDueTime('');
      setImageUrl(undefined);
      setImageSource(undefined);
    }
    setError('');
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        completed: initialTask ? initialTask.completed : false,
        completedAt: initialTask ? initialTask.completedAt : undefined,
        priority,
        category,
        dueTime: dueTime || undefined,
        imageUrl,
        imageSource,
        imagePrompt: initialTask?.imagePrompt,
        imageSize: initialTask?.imageSize,
        rolledOverFrom: initialTask?.rolledOverFrom,
      },
      initialTask ? initialTask.id : undefined
    );
    onClose();
  };

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="task-modal-dialog"
        className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
          <h3 className="text-base font-bold text-stone-900">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </h3>
          <button
            id="btn-close-task-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-stone-700 mb-1">
              Task Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="e.g., Finalize quarterly budget report..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Description & Photo Attachment */}
          <div>
            <label htmlFor="task-desc-input" className="block text-xs font-semibold text-stone-700 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              id="task-desc-input"
              rows={3}
              placeholder="Add extra context, links, or sub-bullets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
            />

            {/* Photo Attachment (Files / Camera) */}
            <TaskPhotoAttachment
              imageUrl={imageUrl}
              imageSource={imageSource}
              onPhotoChange={(url, source) => {
                setImageUrl(url);
                setImageSource(source);
              }}
            />
          </div>

          {/* Date and Due Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-date-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Scheduled Date
              </label>
              <div className="relative">
                <input
                  id="task-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                />
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="task-due-time-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Target Time (Optional)
              </label>
              <div className="relative">
                <input
                  id="task-due-time-input"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                />
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-800 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="task-category-select" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent capitalize"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health & Fitness</option>
                <option value="learning">Learning & Study</option>
                <option value="finance">Finance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

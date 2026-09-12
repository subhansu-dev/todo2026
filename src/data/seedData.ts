import { Task } from '../types';
import { getTodayString, shiftDate } from '../utils/dateUtils';

export function getInitialTasks(): Task[] {
  const today = getTodayString();
  const yesterday = shiftDate(today, -1);
  const twoDaysAgo = shiftDate(today, -2);
  const threeDaysAgo = shiftDate(today, -3);

  return [
    // Today's tasks
    {
      id: 'task-today-1',
      title: 'Review team weekly sprint roadmap & assign blockers',
      description: 'Go through Jira backlog and finalize sprint goal for the team.',
      date: today,
      completed: false,
      priority: 'high',
      category: 'work',
      dueTime: '11:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-today-2',
      title: 'Morning 30-min cardio & stretching routine',
      description: 'Jog in the neighborhood park followed by core stretching.',
      date: today,
      completed: true,
      completedAt: new Date().toISOString(),
      priority: 'medium',
      category: 'health',
      dueTime: '07:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-today-3',
      title: 'Read 2 chapters of System Design Interview book',
      description: 'Focus on distributed cache consistency and rate limiter patterns.',
      date: today,
      completed: false,
      priority: 'medium',
      category: 'learning',
      dueTime: '16:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-today-4',
      title: 'Grocery replenishment for weekend meal prep',
      description: 'Fresh vegetables, Greek yogurt, salmon fillets, and oats.',
      date: today,
      completed: false,
      priority: 'low',
      category: 'personal',
      dueTime: '18:30',
      createdAt: new Date().toISOString(),
    },

    // Yesterday's tasks (Review Previous Day)
    {
      id: 'task-yest-1',
      title: 'Draft quarterly product presentation slides',
      description: 'Consolidated key KPI charts and user retention metrics from analytics.',
      date: yesterday,
      completed: true,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      priority: 'high',
      category: 'work',
      dueTime: '14:00',
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      id: 'task-yest-2',
      title: 'Follow up with design team on prototype feedback',
      description: 'Needed client approval on the dark mode navigation components.',
      date: yesterday,
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
      priority: 'medium',
      category: 'work',
      dueTime: '16:30',
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      id: 'task-yest-3',
      title: 'Research high-yield savings accounts & update budget',
      description: 'Unfinished from yesterday - compare rates between Marcus and Ally.',
      date: yesterday,
      completed: false,
      priority: 'medium',
      category: 'finance',
      dueTime: '19:00',
      createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    },

    // Two days ago tasks
    {
      id: 'task-2da-1',
      title: 'Submit monthly expense receipts for reimbursement',
      description: 'Exported travel invoices and cloud subscription bills to accounting portal.',
      date: twoDaysAgo,
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      priority: 'high',
      category: 'finance',
      dueTime: '15:00',
      createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    },
    {
      id: 'task-2da-2',
      title: 'Attend React Server Components deep-dive webinar',
      description: 'Took notes on streaming SSR and cache lifecycle directives.',
      date: twoDaysAgo,
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 2.1).toISOString(),
      priority: 'low',
      category: 'learning',
      dueTime: '17:00',
      createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    },

    // Three days ago tasks
    {
      id: 'task-3da-1',
      title: 'Organize workspace desk and clean keyboard/monitors',
      description: 'Cable management and wiped down dual displays.',
      date: threeDaysAgo,
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      priority: 'low',
      category: 'personal',
      dueTime: '20:00',
      createdAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
    }
  ];
}

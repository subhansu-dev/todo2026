export type Priority = 'low' | 'medium' | 'high';

export type Category = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  category: Category;
  dueTime?: string; // e.g. "14:30"
  imageUrl?: string;
  imagePrompt?: string;
  imageSize?: '1K' | '2K' | '4K';
  imageSource?: 'upload' | 'camera' | 'gemini';
  rolledOverFrom?: string; // previous date if carried over
  createdAt: string;
}

export interface DaySummary {
  date: string;
  formattedDate: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
  suggestedTasks?: Array<{
    title: string;
    priority?: Priority;
    category?: Category;
    dueTime?: string;
  }>;
}

export type GeminiChatModel = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

export interface ChatRoleConfig {
  id: string;
  name: string;
  shortRole: string;
  description: string;
  systemInstruction: string;
  iconName: string;
}

export interface ImageGenState {
  prompt: string;
  imageSize: '1K' | '2K' | '4K';
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4';
  targetTaskId?: string;
}

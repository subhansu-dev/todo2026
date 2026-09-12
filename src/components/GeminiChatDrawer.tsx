import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Clock,
  CornerDownLeft,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, ChatRoleConfig, GeminiChatModel, Task } from '../types';
import { formatFriendlyDate, getTodayString, shiftDate } from '../utils/dateUtils';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  currentDate: string;
  onAddTaskFromSuggestion: (task: { title: string; priority?: 'low' | 'medium' | 'high'; category?: string }) => void;
}

const ROLES: ChatRoleConfig[] = [
  {
    id: 'planner',
    name: 'Daily Planner & Organizer',
    shortRole: 'Planner',
    description: 'Audits past tasks, organizes time-blocks, and plans your schedule.',
    systemInstruction:
      'You are an expert Daily Planner and Executive Organizer. Your goal is to help the user audit yesterday and previous days unfinished tasks, review their accomplishments, sequence today\'s tasks by priority, and build an achievable daily schedule. Keep answers clear, structured, and actionable.',
    iconName: 'planner',
  },
  {
    id: 'coach',
    name: 'Productivity Coach',
    shortRole: 'Coach',
    description: 'Boosts motivation, analyzes habits, and prevents procrastination.',
    systemInstruction:
      'You are an empathetic, disciplined, and high-energy Productivity Coach. Your mission is to help the user build positive momentum, celebrate completed tasks from past days, review pending blockers, and maintain focus without burnout.',
    iconName: 'coach',
  },
  {
    id: 'breakdown',
    name: 'Task Breakdown Specialist',
    shortRole: 'Breakdown',
    description: 'Splits complex or intimidating tasks into atomic, bite-sized steps.',
    systemInstruction:
      'You are a Task Breakdown Specialist. Your specialty is taking overwhelming, big, or vague goals and decomposing them into 3 to 5 atomic, concrete, sequential subtasks with suggested priorities.',
    iconName: 'breakdown',
  },
];

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  currentDate,
  onAddTaskFromSuggestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-msg',
      role: 'assistant',
      text: "Hello! I'm your Gemini Task Copilot. I have full context of your daily tasks, completed work, and previous days' logs. How can I help you plan or review your day?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedRole, setSelectedRole] = useState<ChatRoleConfig>(ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<GeminiChatModel>('gemini-3.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Build task context string to ground the chatbot
  const buildTaskContext = () => {
    const todayStr = getTodayString();
    const yesterdayStr = shiftDate(todayStr, -1);

    const todayTasks = tasks.filter((t) => t.date === todayStr);
    const yesterdayTasks = tasks.filter((t) => t.date === yesterdayStr);
    const viewingTasks = tasks.filter((t) => t.date === currentDate);

    const summarizeList = (list: Task[]) => {
      if (list.length === 0) return 'No tasks recorded.';
      return list
        .map(
          (t) =>
            `- [${t.completed ? 'x' : ' '}] ${t.title} (Priority: ${t.priority}, Category: ${
              t.category
            }${t.dueTime ? `, Due: ${t.dueTime}` : ''})`
        )
        .join('\n');
    };

    return `
Today's Date: ${todayStr}
Currently Selected Date in App: ${currentDate} (${formatFriendlyDate(currentDate)})

Tasks for Currently Selected Date (${currentDate}):
${summarizeList(viewingTasks)}

Yesterday's Tasks (${yesterdayStr}):
${summarizeList(yesterdayTasks)}

Today's Tasks (${todayStr}):
${summarizeList(todayTasks)}
`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const taskContext = buildTaskContext();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          systemInstruction: selectedRole.systemInstruction,
          model: selectedModel,
          taskContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        suggestedTasks: data.suggestedTasks && data.suggestedTasks.length > 0 ? data.suggestedTasks : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const msg = err instanceof Error ? err.message : 'Error communicating with Gemini chatbot.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'I ran into an issue connecting to the model. Please check your network or try switching to another model (e.g. gemini-3.5-flash).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'init-msg-cleared',
        role: 'assistant',
        text: `Conversation restarted with ${selectedRole.name}. How can I assist with your tasks?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  const promptSuggestions = [
    'Review my tasks from yesterday and summarize what is left.',
    'Help me prioritize today\'s tasks.',
    'Break down my highest priority task into 3 steps.',
    'Suggest 2 quick productivity wins for this afternoon.',
  ];

  return (
    <div
      id="gemini-chat-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="gemini-chat-drawer"
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Gemini Task Copilot</h3>
                <p className="text-xs text-stone-500">Multi-turn AI Assistant for Daily Tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
                title="Reset Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="btn-close-chat"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Role and Model Selectors */}
          <div className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs">
            {/* Role dropdown */}
            <div>
              <label htmlFor="chat-role-select" className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Assistant Role
              </label>
              <div className="relative">
                <select
                  id="chat-role-select"
                  value={selectedRole.id}
                  onChange={(e) => {
                    const role = ROLES.find((r) => r.id === e.target.value);
                    if (role) setSelectedRole(role);
                  }}
                  className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-stone-300 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Model selector */}
            <div>
              <label htmlFor="chat-model-select" className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Gemini Model
              </label>
              <div className="relative">
                <select
                  id="chat-model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GeminiChatModel)}
                  className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-[11px] text-stone-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div
          id="chat-messages-scroll-area"
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-tr-xs'
                      : 'bg-white border border-stone-200 text-stone-800 shadow-xs rounded-tl-xs'
                  }`}
                >
                  {/* Message body */}
                  <div className={`prose prose-sm max-w-none break-words ${isUser ? 'prose-invert text-white' : 'text-stone-800'}`}>
                    <Markdown>{msg.text}</Markdown>
                  </div>

                  {/* Suggested tasks buttons if model proposed tasks */}
                  {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1.5">
                      <p className="text-[11px] font-semibold text-stone-500">
                        Suggested Tasks to Add:
                      </p>
                      {msg.suggestedTasks.map((st, idx) => {
                        const key = `${msg.id}-${idx}`;
                        const isAdded = addedTasks[key];

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                          >
                            <span className="font-medium text-stone-800 truncate">
                              {st.title}
                            </span>
                            <button
                              onClick={() => {
                                onAddTaskFromSuggestion(st);
                                setAddedTasks((prev) => ({ ...prev, [key]: true }));
                              }}
                              disabled={isAdded}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ${
                                isAdded
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Add to Tasks</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Timestamp & Model badge */}
                  <div
                    className={`flex items-center gap-2 mt-2 pt-1 text-[10px] ${
                      isUser ? 'text-stone-400 justify-end' : 'text-stone-400 justify-between'
                    }`}
                  >
                    {!isUser && msg.modelUsed && (
                      <span className="font-mono text-[9px] bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-stone-500 pl-9">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{selectedRole.shortRole} is thinking ({selectedModel})...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 border-t border-stone-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-full shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-stone-200 bg-white">
          {error && (
            <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${selectedRole.shortRole} about tasks, planning, or breakdown...`}
              className="w-full pl-3.5 pr-12 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none transition-all"
            />
            <button
              id="btn-send-chat-message"
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2.5 bottom-3.5 p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-lg transition-colors shadow-xs"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="font-medium text-stone-500">Gemini Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  User, 
  Bot, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronDown, 
  Zap, 
  ShieldAlert, 
  Sliders, 
  FileText,
  Clock
} from 'lucide-react';
import { MeetingAgenda, ChatMessage, ChatRole } from '../types/agenda';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: MeetingAgenda | null;
  onApplyAgendaRefinement?: (command: string) => Promise<void>;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  agenda,
  onApplyAgendaRefinement,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello! I'm your Gemini Meeting Copilot. I've loaded your agenda context. Ask me to tighten topics, suggest pre-meeting reading, stress-test discussion questions, or draft your calendar invite.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [role, setRole] = useState<ChatRole>('facilitator');
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const roleDescriptions: Record<ChatRole, { title: string; icon: any; desc: string }> = {
    facilitator: {
      title: 'Meeting Facilitator',
      icon: Clock,
      desc: 'Keeps topics on schedule, prevents tangents, and frames discussion questions.',
    },
    challenger: {
      title: 'Executive Challenger',
      icon: ShieldAlert,
      desc: 'Devil’s advocate: spots hidden assumptions, risks, and contentious friction points.',
    },
    optimizer: {
      title: 'Agenda Optimizer',
      icon: Sliders,
      desc: 'Compresses bloated topics, suggests async pre-reads, and balances speaking time.',
    },
    scribe: {
      title: 'Action Scribe',
      icon: FileText,
      desc: 'Synthesizes decisions, extracts accountability deliverables, and writes invites.',
    },
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          role,
          agendaContext: agenda,
          model,
        }),
      });

      const data = await response.json();

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || 'I analyzed the request and have no additional comments.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: 'Sorry, I encountered an error communicating with Gemini. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickChips = [
    { label: 'Tighten meeting by 15 mins', prompt: 'Please recommend exactly which topics to compress so we shave 15 minutes off this meeting while retaining decision points.' },
    { label: 'What prep should stakeholders do?', prompt: 'Provide a breakdown of what each stakeholder should review or prepare before entering this meeting.' },
    { label: 'Draft calendar invite email', prompt: 'Draft a clean, professional calendar invitation email with bulleted agenda, times, and expected outcomes.' },
    { label: 'Stress-test biggest risks', prompt: 'What are the top 3 risks that this meeting will derail or fail to achieve its core goal, and how do we prevent them?' },
  ];

  return (
    <aside className="fixed right-0 top-16 bottom-0 z-40 w-full sm:w-[440px] xl:w-[480px] bg-white border-l border-zinc-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-zinc-900">Gemini Meeting Copilot</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                {model}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {roleDescriptions[role].title} Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome-reset',
                  role: 'model',
                  content: 'Chat reset. How can I assist with your meeting agenda?',
                  timestamp: 'Just now',
                },
              ]);
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60"
            title="Reset conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60"
            title="Close Copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role & Model Selectors */}
      <div className="p-3 border-b border-zinc-100 bg-white space-y-2 text-xs">
        {/* Role Chips */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
            Bot Persona / Role:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(roleDescriptions) as ChatRole[]).map((r) => {
              const info = roleDescriptions[r];
              const Icon = info.icon;
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                      : 'bg-zinc-50/70 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className={`h-3 w-3 shrink-0 ${isSelected ? 'text-indigo-300' : 'text-zinc-500'}`} />
                  <span className="truncate text-[11px]">{info.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-medium text-zinc-500">Gemini Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-800 font-medium focus:outline-hidden"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
          </select>
        </div>
      </div>

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isUser ? (
                  <span className="text-[10px] font-semibold text-zinc-400">You</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500" />
                    <span className="text-[10px] font-semibold text-zinc-600">
                      Gemini Copilot
                    </span>
                  </div>
                )}
                <span className="text-[9px] text-zinc-400">{msg.timestamp}</span>
              </div>

              <div
                className={`relative max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-zinc-900 text-white rounded-tr-xs'
                    : 'bg-white text-zinc-800 border border-zinc-200 shadow-2xs rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Quick copy message */}
                {!isUser && (
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-700 bg-white/90 rounded border border-zinc-200 transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 italic p-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
            <span>Gemini is analyzing the agenda...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-3 py-2 border-t border-zinc-100 bg-white overflow-x-auto whitespace-nowrap flex gap-1.5">
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip.prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-200 text-zinc-700 hover:text-indigo-800 transition-colors shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-zinc-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask the ${roleDescriptions[role].title}...`}
          disabled={isLoading}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-zinc-900 p-2 text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
};

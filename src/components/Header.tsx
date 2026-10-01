import React from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Play, 
  Share2, 
  MessageSquare, 
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import { MeetingAgenda } from '../types/agenda';

interface HeaderProps {
  agenda: MeetingAgenda | null;
  onOpenLiveMode: () => void;
  onOpenExport: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  unreadChatCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  agenda,
  onOpenLiveMode,
  onOpenExport,
  isChatOpen,
  onToggleChat,
  unreadChatCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Brand & Title */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
          <Calendar className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              AgendaCraft
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-600 border border-zinc-200/80">
              AI TIMELINE
            </span>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-1 max-w-[280px] sm:max-w-md">
            {agenda ? agenda.meetingTitle : 'Upload any doc to synthesize meeting agendas'}
          </p>
        </div>
      </div>

      {/* Center status info when agenda loaded */}
      {agenda && (
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-zinc-700">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-medium text-zinc-900">{agenda.totalDurationMinutes} min</span>
            <span className="text-zinc-400">•</span>
            <span>Starts at {agenda.startTime}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-zinc-700">
            <span className="font-medium text-zinc-900">{agenda.topics.length}</span> Topics
            <span className="text-zinc-400">•</span>
            <span className="font-medium text-zinc-900">{agenda.stakeholders.length}</span> Stakeholders
          </div>

          {/* Meeting Category Tags */}
          {agenda.tags && agenda.tags.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5">
              {agenda.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 border border-zinc-200/90"
                >
                  <Tag className="h-3 w-3 text-zinc-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {agenda && (
          <>
            <button
              onClick={onOpenLiveMode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              title="Start real-time interactive meeting runner"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Live Run</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              title="Export as Markdown, Calendar (.ics), or Print"
            >
              <Share2 className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </>
        )}

        {/* Gemini Copilot Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-indigo-100'
              : 'border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80'
          }`}
        >
          <Sparkles className={`h-3.5 w-3.5 ${isChatOpen ? 'text-indigo-200' : 'text-indigo-600'}`} />
          <span>AI Copilot</span>
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

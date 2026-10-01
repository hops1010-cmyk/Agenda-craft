import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle, 
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  HelpCircle
} from 'lucide-react';
import { MeetingAgenda, AgendaTopic } from '../types/agenda';
import { calculateTimeSlot, parseTimeToMinutes } from '../lib/utils';

interface LiveMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: MeetingAgenda;
  onUpdateAgenda: (updated: MeetingAgenda) => void;
}

export const LiveMeetingModal: React.FC<LiveMeetingModalProps> = ({
  isOpen,
  onClose,
  agenda,
  onUpdateAgenda,
}) => {
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');

  const currentTopic: AgendaTopic | undefined = agenda.topics[activeTopicIndex];

  // Initialize timer whenever activeTopic changes
  useEffect(() => {
    if (currentTopic) {
      setSecondsRemaining(currentTopic.durationMinutes * 60);
      setNotes(currentTopic.notes || '');
    }
  }, [activeTopicIndex, currentTopic]);

  // Interval timer
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => Math.max(0, sec - 1));
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      // time up
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  if (!isOpen || !currentTopic) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextTopic = () => {
    // Save current notes
    const updatedTopics = agenda.topics.map((t, idx) =>
      idx === activeTopicIndex ? { ...t, notes, status: 'completed' as const } : t
    );

    if (activeTopicIndex < agenda.topics.length - 1) {
      setActiveTopicIndex(activeTopicIndex + 1);
    } else {
      setIsRunning(false);
    }

    onUpdateAgenda({ ...agenda, topics: updatedTopics });
  };

  const handlePrevTopic = () => {
    if (activeTopicIndex > 0) {
      setActiveTopicIndex(activeTopicIndex - 1);
    }
  };

  const currentPresenter = agenda.stakeholders.find((s) => s.id === currentTopic.presenterId) || {
    name: currentTopic.presenterName || 'Lead',
    avatarColor: 'bg-zinc-800 text-white',
    role: 'Presenter',
  };

  const progressPct =
    agenda.topics.length > 0
      ? Math.round(((activeTopicIndex + 1) / agenda.topics.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Bar */}
        <div className="p-4 px-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">
              Live Meeting Mode
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs font-semibold text-white truncate max-w-xs">
              {agenda.meetingTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">
              Topic {activeTopicIndex + 1} of {agenda.topics.length}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="h-1.5 w-full bg-zinc-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Central Display */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Topic Header & Big Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Current Agenda Item
              </span>
              <h3 className="text-xl font-bold text-zinc-900">{currentTopic.title}</h3>
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentPresenter.avatarColor}`}>
                  {currentPresenter.name.charAt(0)}
                </div>
                <span className="font-semibold text-zinc-800">{currentPresenter.name}</span>
                <span className="text-zinc-400">•</span>
                <span className="capitalize">{currentTopic.purpose}</span>
              </div>
            </div>

            {/* Big Countdown Timer */}
            <div className="flex flex-col items-center sm:items-end">
              <div
                className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight ${
                  secondsRemaining === 0
                    ? 'text-red-600 animate-pulse'
                    : secondsRemaining < 60
                    ? 'text-amber-600'
                    : 'text-zinc-900'
                }`}
              >
                {formatTimer(secondsRemaining)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                    isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isRunning ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  <span>{isRunning ? 'Pause' : 'Start Timer'}</span>
                </button>
                <button
                  onClick={() => setSecondsRemaining(currentTopic.durationMinutes * 60)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-200 border border-zinc-200 bg-white"
                  title="Reset topic timer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Key Discussion Questions */}
          {currentTopic.keyQuestions && currentTopic.keyQuestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                <span>Discussion Prompts to Resolve</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentTopic.keyQuestions.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 leading-snug">
                    <span className="font-bold text-indigo-600 mr-1.5">Q{i + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Outcome */}
          {currentTopic.expectedOutcome && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
              <Target className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px] uppercase tracking-wider">
                  Target Resolution for this block:
                </span>
                <span>{currentTopic.expectedOutcome}</span>
              </div>
            </div>
          )}

          {/* Live Meeting Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Live Meeting Notes & Decisions:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record consensus points, agreed decisions, or blockers..."
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Bottom Nav Footer */}
        <div className="p-4 px-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <button
            onClick={handlePrevTopic}
            disabled={activeTopicIndex === 0}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Previous Topic
          </button>

          <button
            onClick={handleNextTopic}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs"
          >
            <span>{activeTopicIndex < agenda.topics.length - 1 ? 'Next Topic' : 'Finish Meeting'}</span>
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

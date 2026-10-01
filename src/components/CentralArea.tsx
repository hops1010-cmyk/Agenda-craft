import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Sliders, 
  FileText, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  HelpCircle, 
  Target, 
  Tag, 
  CheckSquare, 
  Square,
  Play,
  RotateCcw
} from 'lucide-react';
import { MeetingAgenda, AgendaTopic, Stakeholder, ActionItem } from '../types/agenda';
import { calculateTimeSlot, parseTimeToMinutes, formatMinutes } from '../lib/utils';
import { TopicEditDialog } from './TopicEditDialog';
import { StakeholderEditDialog } from './StakeholderEditDialog';

interface CentralAreaProps {
  agenda: MeetingAgenda | null;
  onUpdateAgenda: (updatedAgenda: MeetingAgenda) => void;
  onOpenLiveMode: () => void;
  isLoading: boolean;
}

export const CentralArea: React.FC<CentralAreaProps> = ({
  agenda,
  onUpdateAgenda,
  onOpenLiveMode,
  isLoading,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'matrix'>('timeline');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<AgendaTopic | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [newActionItemTitle, setNewActionItemTitle] = useState('');
  const [selectedActionAssignee, setSelectedActionAssignee] = useState('');
  const [checkedDecisions, setCheckedDecisions] = useState<Record<number, boolean>>({});

  if (!agenda) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
            <Calendar className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Synthesize Your Meeting Agenda
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Select one of the sample documents on the left or upload any PRD, RFC, or briefing note.
            AgendaCraft will automatically detect stakeholders, map sequential topics, and build your interactive meeting timeline.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-600">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Powered by Gemini
            </span>
            <span>•</span>
            <span>Zero manual math</span>
            <span>•</span>
            <span>Live timekeeper</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total topic minutes
  const totalTopicMinutes = agenda.topics.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const durationDifference = totalTopicMinutes - agenda.targetDurationMinutes;
  const startBaseMinutes = parseTimeToMinutes(agenda.startTime || '10:00 AM');

  // Compute stakeholder time allocation
  const stakeholderTimeMap: Record<string, number> = {};
  agenda.topics.forEach((t) => {
    const sId = t.presenterId || 'unknown';
    stakeholderTimeMap[sId] = (stakeholderTimeMap[sId] || 0) + t.durationMinutes;
  });

  // Rebalance helper
  const handleAutoRebalance = () => {
    if (agenda.topics.length === 0 || durationDifference === 0) return;
    const ratio = agenda.targetDurationMinutes / totalTopicMinutes;
    let distributed = 0;
    const updatedTopics = agenda.topics.map((t, idx) => {
      if (idx === agenda.topics.length - 1) {
        // Last topic gets remaining to match exactly
        const lastMinutes = Math.max(5, agenda.targetDurationMinutes - distributed);
        return { ...t, durationMinutes: lastMinutes };
      }
      const newMinutes = Math.max(5, Math.round(t.durationMinutes * ratio));
      distributed += newMinutes;
      return { ...t, durationMinutes: newMinutes };
    });

    onUpdateAgenda({
      ...agenda,
      topics: updatedTopics,
      totalDurationMinutes: agenda.targetDurationMinutes,
    });
  };

  // Adjust duration by delta
  const handleAdjustDuration = (topicId: string, delta: number) => {
    const updated = agenda.topics.map((t) => {
      if (t.id === topicId) {
        return { ...t, durationMinutes: Math.max(5, t.durationMinutes + delta) };
      }
      return t;
    });
    const newTotal = updated.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({
      ...agenda,
      topics: updated,
      totalDurationMinutes: newTotal,
    });
  };

  // Move topic up/down
  const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= agenda.topics.length) return;
    const topicsCopy = [...agenda.topics];
    const [moved] = topicsCopy.splice(index, 1);
    topicsCopy.splice(targetIndex, 0, moved);
    onUpdateAgenda({
      ...agenda,
      topics: topicsCopy,
    });
  };

  // Topic status toggle
  const handleToggleTopicStatus = (topicId: string) => {
    const statusOrder: ('not_started' | 'in_progress' | 'completed')[] = ['not_started', 'in_progress', 'completed'];
    const updated = agenda.topics.map((t) => {
      if (t.id === topicId) {
        const nextIdx = (statusOrder.indexOf(t.status as any) + 1) % statusOrder.length;
        return { ...t, status: statusOrder[nextIdx] };
      }
      return t;
    });
    onUpdateAgenda({ ...agenda, topics: updated });
  };

  // Save topic from dialog
  const handleSaveTopic = (savedTopic: AgendaTopic) => {
    const exists = agenda.topics.some((t) => t.id === savedTopic.id);
    let updatedTopics: AgendaTopic[];
    if (exists) {
      updatedTopics = agenda.topics.map((t) => (t.id === savedTopic.id ? savedTopic : t));
    } else {
      updatedTopics = [...agenda.topics, savedTopic];
    }
    const newTotal = updatedTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({
      ...agenda,
      topics: updatedTopics,
      totalDurationMinutes: newTotal,
    });
  };

  // Delete topic
  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = agenda.topics.filter((t) => t.id !== topicId);
    const newTotal = updatedTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({
      ...agenda,
      topics: updatedTopics,
      totalDurationMinutes: newTotal,
    });
  };

  // Save stakeholder
  const handleSaveStakeholder = (savedStakeholder: Stakeholder) => {
    const exists = agenda.stakeholders.some((s) => s.id === savedStakeholder.id);
    let updatedStakeholders: Stakeholder[];
    if (exists) {
      updatedStakeholders = agenda.stakeholders.map((s) => (s.id === savedStakeholder.id ? savedStakeholder : s));
    } else {
      updatedStakeholders = [...agenda.stakeholders, savedStakeholder];
    }
    onUpdateAgenda({
      ...agenda,
      stakeholders: updatedStakeholders,
    });
  };

  // Delete stakeholder
  const handleDeleteStakeholder = (stkId: string) => {
    if (agenda.stakeholders.length <= 1) return;
    const updatedStakeholders = agenda.stakeholders.filter((s) => s.id !== stkId);
    onUpdateAgenda({
      ...agenda,
      stakeholders: updatedStakeholders,
    });
  };

  // Add action item
  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionItemTitle.trim()) return;
    const newAct: ActionItem = {
      id: `act-${Date.now()}`,
      title: newActionItemTitle.trim(),
      assignee: selectedActionAssignee || agenda.stakeholders[0]?.name || 'Unassigned',
      completed: false,
    };
    onUpdateAgenda({
      ...agenda,
      actionItems: [...(agenda.actionItems || []), newAct],
    });
    setNewActionItemTitle('');
  };

  // Toggle action item
  const handleToggleActionItem = (actId: string) => {
    const updated = (agenda.actionItems || []).map((a) =>
      a.id === actId ? { ...a, completed: !a.completed } : a
    );
    onUpdateAgenda({ ...agenda, actionItems: updated });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-50/40 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header & Time Budget Banner */}
      <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="rounded-lg border border-indigo-400 px-2.5 py-1 text-lg font-bold text-zinc-900 w-full focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    onUpdateAgenda({ ...agenda, meetingTitle: titleInput.trim() || agenda.meetingTitle });
                    setIsEditingTitle(false);
                  }}
                  className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  {agenda.meetingTitle}
                </h2>
                <button
                  onClick={() => {
                    setTitleInput(agenda.meetingTitle);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 transition-opacity"
                  title="Rename meeting"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 uppercase tracking-wider">
                {agenda.meetingType}
              </span>
              <p className="text-xs text-zinc-500 italic">
                "{agenda.meetingGoal}"
              </p>
            </div>
          </div>

          {/* Start Time & Live Mode Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <label className="text-zinc-600 font-medium">Start Time:</label>
              <select
                value={agenda.startTime}
                onChange={(e) => onUpdateAgenda({ ...agenda, startTime: e.target.value })}
                className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
              >
                {['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenLiveMode}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
              <span>Launch Live Meeting</span>
            </button>
          </div>
        </div>

        {/* Proportional Segmented Timeline Bar */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800">Time Budget Breakdown</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-600">
                Scheduled: <strong className="text-zinc-900">{totalTopicMinutes} min</strong> / Target: <strong className="text-zinc-900">{agenda.targetDurationMinutes} min</strong>
              </span>
            </div>

            {durationDifference === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Exact Fit ({agenda.targetDurationMinutes}m)
              </span>
            ) : durationDifference > 0 ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle className="h-3 w-3" /> +{durationDifference}m over target
                </span>
                <button
                  onClick={handleAutoRebalance}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Auto-Fit to {agenda.targetDurationMinutes}m
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {Math.abs(durationDifference)}m buffer remaining
                </span>
                <button
                  onClick={handleAutoRebalance}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Auto-Fit
                </button>
              </div>
            )}
          </div>

          {/* Colored segmented progress strip */}
          <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden flex border border-zinc-200/60">
            {agenda.topics.map((topic, i) => {
              const widthPct = (topic.durationMinutes / Math.max(totalTopicMinutes, 1)) * 100;
              const colors = [
                'bg-indigo-500',
                'bg-blue-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-purple-500',
                'bg-rose-500',
                'bg-teal-500',
              ];
              const bgClass = colors[i % colors.length];
              return (
                <div
                  key={topic.id}
                  style={{ width: `${widthPct}%` }}
                  title={`${topic.title} (${topic.durationMinutes}m)`}
                  className={`${bgClass} transition-all duration-300 relative group cursor-pointer hover:opacity-85 border-r border-white/30`}
                  onClick={() => setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Stakeholders Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Users className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Stakeholders & Responsibilities ({agenda.stakeholders.length})
            </h3>
          </div>

          <button
            onClick={() => {
              setEditingStakeholder(null);
              setIsStakeholderModalOpen(true);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1 bg-white hover:bg-zinc-50 shadow-2xs"
          >
            <Plus className="h-3 w-3" />
            <span>Add Stakeholder</span>
          </button>
        </div>

        {/* Stakeholder Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {agenda.stakeholders.map((s) => {
            const timeAllocated = stakeholderTimeMap[s.id] || 0;
            const pctOfMeeting = totalTopicMinutes > 0 ? Math.round((timeAllocated / totalTopicMinutes) * 100) : 0;

            const roleBadgeStyles: Record<string, string> = {
              Organizer: 'bg-zinc-100 text-zinc-800 border-zinc-200',
              'Decision Maker': 'bg-rose-50 text-rose-700 border-rose-200',
              Presenter: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              Contributor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'Key Stakeholder': 'bg-amber-50 text-amber-700 border-amber-200',
              Observer: 'bg-zinc-50 text-zinc-600 border-zinc-200',
            };

            return (
              <div
                key={s.id}
                className="group relative rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${s.avatarColor || 'bg-zinc-800 text-white'}`}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{s.name}</h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{s.title}</p>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingStakeholder(s);
                          setIsStakeholderModalOpen(true);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-700 rounded"
                        title="Edit stakeholder"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteStakeholder(s.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded"
                        title="Remove stakeholder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeStyles[s.role] || 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}>
                      {s.role}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">{s.department}</span>
                  </div>

                  {s.prepNotes && (
                    <div className="mt-2 rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-600 border border-zinc-100 leading-snug">
                      <span className="font-semibold text-zinc-700 block text-[10px] uppercase tracking-wider mb-0.5">
                        Prep Notes:
                      </span>
                      {s.prepNotes}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Speaking / Lead:</span>
                  <span className="font-semibold text-zinc-900">
                    {timeAllocated} min ({pctOfMeeting}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Topics & Interactive Timeline View */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Meeting Timeline & Topics ({agenda.topics.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                Adjust minutes, reorder sequence, or inspect discussion questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex rounded-lg bg-zinc-200/60 p-0.5 border border-zinc-200">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Timeline View
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Grid View
              </button>
            </div>

            <button
              onClick={() => {
                setEditingTopic({
                  id: `topic-${Date.now()}`,
                  title: '',
                  durationMinutes: 10,
                  presenterId: agenda.stakeholders[0]?.id || 'stk-1',
                  presenterName: agenda.stakeholders[0]?.name || 'Leader',
                  purpose: 'discussion',
                  description: '',
                  keyQuestions: [],
                  expectedOutcome: '',
                  tag: 'General',
                  status: 'not_started',
                });
                setIsTopicModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg px-3 py-1.5 shadow-2xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Topic</span>
            </button>
          </div>
        </div>

        {/* Timeline View Mode */}
        {viewMode === 'timeline' ? (
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
            {agenda.topics.map((topic, index) => {
              // Calculate cumulative start time
              let prevMinutes = 0;
              for (let i = 0; i < index; i++) {
                prevMinutes += agenda.topics[i].durationMinutes;
              }
              const slot = calculateTimeSlot(startBaseMinutes + prevMinutes, topic.durationMinutes);
              const isExpanded = expandedTopicId === topic.id;
              const presenter = agenda.stakeholders.find((s) => s.id === topic.presenterId) || {
                name: topic.presenterName || 'Presenter',
                avatarColor: 'bg-zinc-700 text-white',
                role: 'Presenter',
              };

              const purposeStyles: Record<string, { label: string; style: string }> = {
                decision: { label: 'Decision', style: 'bg-rose-50 text-rose-700 border-rose-200' },
                discussion: { label: 'Discussion', style: 'bg-blue-50 text-blue-700 border-blue-200' },
                presentation: { label: 'Presentation', style: 'bg-purple-50 text-purple-700 border-purple-200' },
                alignment: { label: 'Alignment', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                action_items: { label: 'Action Items', style: 'bg-amber-50 text-amber-700 border-amber-200' },
              };

              const statusColor = 
                topic.status === 'completed'
                  ? 'bg-emerald-500 border-white text-white'
                  : topic.status === 'in_progress'
                  ? 'bg-indigo-600 border-white text-white animate-pulse'
                  : 'bg-white border-zinc-300 text-zinc-600';

              return (
                <div key={topic.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <button
                    onClick={() => handleToggleTopicStatus(topic.id)}
                    title={`Status: ${topic.status}. Click to cycle status.`}
                    className={`absolute -left-6 sm:-left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-xs transition-transform hover:scale-110 ${statusColor}`}
                  >
                    {topic.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  {/* Card Container */}
                  <div
                    className={`rounded-2xl border transition-all ${
                      topic.status === 'completed'
                        ? 'border-zinc-200 bg-zinc-50/60 opacity-80'
                        : isExpanded
                        ? 'border-indigo-300 bg-white shadow-md ring-1 ring-indigo-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Topic Card Header */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Time Slot & Tag Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80">
                            {slot.startStr} - {slot.endStr}
                          </span>

                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
                            {topic.durationMinutes} min
                          </span>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${purposeStyles[topic.purpose]?.style || 'bg-zinc-100 text-zinc-700'}`}>
                            {purposeStyles[topic.purpose]?.label || topic.purpose}
                          </span>

                          {topic.tag && (
                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200">
                              {topic.tag}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className={`text-base font-bold text-zinc-900 ${topic.status === 'completed' ? 'line-through text-zinc-400' : ''}`}>
                          {topic.title}
                        </h4>

                        {/* Presenter Pill */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${presenter.avatarColor || 'bg-zinc-800 text-white'}`}>
                            {presenter.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-zinc-700">
                            {presenter.name}
                          </span>
                          <span className="text-xs text-zinc-400">• Lead</span>
                        </div>
                      </div>

                      {/* Interactive Controls & Time Adjusters */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        {/* Shave / Add 5 mins */}
                        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                          <button
                            onClick={() => handleAdjustDuration(topic.id, -5)}
                            disabled={topic.durationMinutes <= 5}
                            className="rounded px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Subtract 5 minutes"
                          >
                            -5m
                          </button>
                          <span className="px-1.5 text-xs font-bold text-zinc-800">
                            {topic.durationMinutes}m
                          </span>
                          <button
                            onClick={() => handleAdjustDuration(topic.id, 5)}
                            className="rounded px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-white hover:text-zinc-900"
                            title="Add 5 minutes"
                          >
                            +5m
                          </button>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                          <button
                            onClick={() => handleMoveTopic(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-20 rounded"
                            title="Move topic up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveTopic(index, 'down')}
                            disabled={index === agenda.topics.length - 1}
                            className="p-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-20 rounded"
                            title="Move topic down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Edit dialog */}
                        <button
                          onClick={() => {
                            setEditingTopic(topic);
                            setIsTopicModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100"
                          title="Edit topic details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete topic */}
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete topic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {/* Toggle expand */}
                        <button
                          onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                          title="Expand topic questions & deliverables"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Deep Topic Details */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-3.5 rounded-b-2xl text-xs animate-in slide-in-from-top-1">
                        {topic.description && (
                          <div>
                            <span className="font-semibold text-zinc-700 block text-[11px] mb-1">
                              Overview:
                            </span>
                            <p className="text-zinc-600 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-200/70">
                              {topic.description}
                            </p>
                          </div>
                        )}

                        {topic.keyQuestions && topic.keyQuestions.length > 0 && (
                          <div>
                            <span className="font-semibold text-zinc-700 block text-[11px] mb-1.5 flex items-center gap-1">
                              <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Key Questions to Solve:</span>
                            </span>
                            <ul className="space-y-1.5">
                              {topic.keyQuestions.map((q, qIdx) => (
                                <li key={qIdx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-zinc-200/70 text-zinc-700">
                                  <span className="font-bold text-indigo-600 shrink-0">Q{qIdx + 1}:</span>
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {topic.expectedOutcome && (
                          <div>
                            <span className="font-semibold text-zinc-700 block text-[11px] mb-1 flex items-center gap-1">
                              <Target className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Expected Deliverable / Resolution:</span>
                            </span>
                            <p className="bg-emerald-50/60 text-emerald-900 border border-emerald-200/80 p-2.5 rounded-lg font-medium">
                              {topic.expectedOutcome}
                            </p>
                          </div>
                        )}

                        {/* Live Notes / Decisions during this topic */}
                        <div>
                          <span className="font-semibold text-zinc-700 block text-[11px] mb-1">
                            Topic Discussion Notes & Live Decisions:
                          </span>
                          <textarea
                            value={topic.notes || ''}
                            onChange={(e) => {
                              const updatedNotes = e.target.value;
                              const updated = agenda.topics.map((t) =>
                                t.id === topic.id ? { ...t, notes: updatedNotes } : t
                              );
                              onUpdateAgenda({ ...agenda, topics: updated });
                            }}
                            rows={2}
                            placeholder="Type notes or agreements captured during this discussion..."
                            className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View Mode */
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Topic Title</th>
                    <th className="py-3 px-4">Lead Presenter</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-center">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {agenda.topics.map((topic, idx) => {
                    let prevMinutes = 0;
                    for (let i = 0; i < idx; i++) {
                      prevMinutes += agenda.topics[i].durationMinutes;
                    }
                    const slot = calculateTimeSlot(startBaseMinutes + prevMinutes, topic.durationMinutes);
                    return (
                      <tr key={topic.id} className="hover:bg-zinc-50/70">
                        <td className="py-3 px-4 font-bold text-zinc-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-zinc-800 whitespace-nowrap">
                          {slot.startStr} - {slot.endStr}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900">
                          {topic.title}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                          {topic.presenterName}
                        </td>
                        <td className="py-3 px-4 capitalize text-zinc-500">
                          {topic.purpose}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700">
                          {topic.durationMinutes}m
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => {
                              setEditingTopic(topic);
                              setIsTopicModalOpen(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1 text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 4. Key Decisions & Action Items Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Required Decisions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-rose-500" />
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Key Decisions to Finalize
              </h4>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              Must resolve before adjourn
            </span>
          </div>

          <div className="space-y-2">
            {(agenda.keyDecisionsNeeded || []).map((decision, dIdx) => {
              const isChecked = !!checkedDecisions[dIdx];
              return (
                <div
                  key={dIdx}
                  onClick={() =>
                    setCheckedDecisions((prev) => ({ ...prev, [dIdx]: !prev[dIdx] }))
                  }
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 line-through'
                      : 'bg-zinc-50/50 border-zinc-200/80 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <span className="mt-0.5 text-zinc-500">
                    {isChecked ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-300" />
                    )}
                  </span>
                  <span className="text-xs font-medium leading-snug">{decision}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Items & Accountability */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Action Items & Ownership
              </h4>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              {(agenda.actionItems || []).filter((a) => a.completed).length}/{(agenda.actionItems || []).length} Completed
            </span>
          </div>

          {/* Action Items List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(agenda.actionItems || []).map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                  item.completed
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-400 line-through'
                    : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleToggleActionItem(item.id)}
                >
                  {item.completed ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-300 shrink-0" />
                  )}
                  <span className="truncate font-medium">{item.title}</span>
                </div>

                <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200 shrink-0">
                  {item.assignee}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Add Action Item */}
          <form onSubmit={handleAddActionItem} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newActionItemTitle}
              onChange={(e) => setNewActionItemTitle(e.target.value)}
              placeholder="Add next step deliverable..."
              className="flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
            />
            <select
              value={selectedActionAssignee}
              onChange={(e) => setSelectedActionAssignee(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 focus:outline-hidden"
            >
              {agenda.stakeholders.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Add
            </button>
          </form>
        </div>
      </section>

      {/* Modals for Edit */}
      <TopicEditDialog
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topic={editingTopic}
        stakeholders={agenda.stakeholders}
        onSave={handleSaveTopic}
      />

      <StakeholderEditDialog
        isOpen={isStakeholderModalOpen}
        onClose={() => setIsStakeholderModalOpen(false)}
        stakeholder={editingStakeholder}
        onSave={handleSaveStakeholder}
      />
    </main>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Clock, User, Check, Tag } from 'lucide-react';
import { AgendaTopic, Stakeholder, TopicPurpose } from '../types/agenda';

interface TopicEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topic: AgendaTopic | null;
  stakeholders: Stakeholder[];
  onSave: (updatedTopic: AgendaTopic) => void;
}

export const TopicEditDialog: React.FC<TopicEditDialogProps> = ({
  isOpen,
  onClose,
  topic,
  stakeholders,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [presenterId, setPresenterId] = useState('');
  const [purpose, setPurpose] = useState<TopicPurpose>('discussion');
  const [description, setDescription] = useState('');
  const [keyQuestionsText, setKeyQuestionsText] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setDurationMinutes(topic.durationMinutes);
      setPresenterId(topic.presenterId || stakeholders[0]?.id || '');
      setPurpose(topic.purpose);
      setDescription(topic.description || '');
      setKeyQuestionsText((topic.keyQuestions || []).join('\n'));
      setExpectedOutcome(topic.expectedOutcome || '');
      setTag(topic.tag || 'General');
    }
  }, [topic, stakeholders]);

  if (!isOpen || !topic) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPresenter = stakeholders.find((s) => s.id === presenterId);
    const questions = keyQuestionsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    onSave({
      ...topic,
      title: title.trim() || 'Untitled Topic',
      durationMinutes: Math.max(1, durationMinutes),
      presenterId: presenterId,
      presenterName: selectedPresenter ? selectedPresenter.name : topic.presenterName,
      purpose,
      description: description.trim(),
      keyQuestions: questions.length > 0 ? questions : topic.keyQuestions,
      expectedOutcome: expectedOutcome.trim(),
      tag: tag.trim() || 'Topic',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">Edit Agenda Topic</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Topic Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="e.g. Architecture Proposal Walkthrough"
            />
          </div>

          {/* Duration & Purpose */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span>Duration (minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={180}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 5)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">Purpose / Format</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as TopicPurpose)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="decision">Decision Required</option>
                <option value="discussion">Open Discussion</option>
                <option value="presentation">Presentation / Demo</option>
                <option value="alignment">Team Alignment</option>
                <option value="action_items">Action Items & Next Steps</option>
              </select>
            </div>
          </div>

          {/* Presenter & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <User className="h-3 w-3 text-zinc-500" />
                <span>Presenter</span>
              </label>
              <select
                value={presenterId}
                onChange={(e) => setPresenterId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              >
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3 text-zinc-500" />
                <span>Category Tag</span>
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Strategy, Architecture, Q&A"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Description / Context</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="Short brief on why this topic is on the agenda..."
            />
          </div>

          {/* Key Questions (one per line) */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Key Questions to Address (one per line)
            </label>
            <textarea
              value={keyQuestionsText}
              onChange={(e) => setKeyQuestionsText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="1. What are the key bottlenecks?&#10;2. Who approves the budget?"
            />
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Expected Deliverable / Resolution</label>
            <input
              type="text"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="e.g. Formal approval on Q3 roadmap and resource commitment"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

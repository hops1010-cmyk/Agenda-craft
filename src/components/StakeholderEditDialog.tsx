import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Building, BookOpen } from 'lucide-react';
import { Stakeholder, StakeholderRole } from '../types/agenda';

interface StakeholderEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholder: Stakeholder | null;
  onSave: (savedStakeholder: Stakeholder) => void;
}

const COLOR_OPTIONS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-indigo-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
  'bg-teal-500 text-white',
];

export const StakeholderEditDialog: React.FC<StakeholderEditDialogProps> = ({
  isOpen,
  onClose,
  stakeholder,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StakeholderRole>('Contributor');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (stakeholder) {
      setName(stakeholder.name);
      setRole(stakeholder.role);
      setTitle(stakeholder.title);
      setDepartment(stakeholder.department);
      setPrepNotes(stakeholder.prepNotes || '');
      setAvatarColor(stakeholder.avatarColor || COLOR_OPTIONS[0]);
    } else {
      setName('');
      setRole('Contributor');
      setTitle('');
      setDepartment('');
      setPrepNotes('');
      setAvatarColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    }
  }, [stakeholder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: stakeholder?.id || `stk-${Date.now()}`,
      name: name.trim() || 'New Stakeholder',
      role,
      title: title.trim() || 'Team Member',
      department: department.trim() || 'General',
      prepNotes: prepNotes.trim(),
      avatarColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">
            {stakeholder ? 'Edit Stakeholder' : 'Add New Stakeholder'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name & Color */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
              <User className="h-3 w-3 text-zinc-500" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Meeting Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StakeholderRole)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Organizer">Organizer</option>
                <option value="Decision Maker">Decision Maker</option>
                <option value="Presenter">Presenter</option>
                <option value="Contributor">Contributor</option>
                <option value="Key Stakeholder">Key Stakeholder</option>
                <option value="Observer">Observer</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <Building className="h-3 w-3 text-zinc-500" />
                <span>Department</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering, Product"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-zinc-500" />
              <span>Job Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Principal Systems Architect"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">Avatar Color</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`h-6 w-6 rounded-full ${c} flex items-center justify-center text-[10px] transition-transform ${
                    avatarColor === c ? 'scale-125 ring-2 ring-zinc-900 ring-offset-2' : 'hover:scale-110'
                  }`}
                >
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </button>
              ))}
            </div>
          </div>

          {/* Prep Notes */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-zinc-500" />
              <span>Pre-meeting Prep & Responsibilities</span>
            </label>
            <textarea
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              rows={3}
              placeholder="Specific reports or slides to review before the meeting starts..."
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
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
              Save Stakeholder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

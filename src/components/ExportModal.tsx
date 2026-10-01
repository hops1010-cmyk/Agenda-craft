import React, { useState } from 'react';
import { X, Copy, Check, Download, Printer, Calendar, FileText } from 'lucide-react';
import { MeetingAgenda } from '../types/agenda';
import { calculateTimeSlot, parseTimeToMinutes } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: MeetingAgenda;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, agenda }) => {
  const [copied, setCopied] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'ics'>('markdown');

  if (!isOpen) return null;

  const startBaseMinutes = parseTimeToMinutes(agenda.startTime || '10:00 AM');

  // Generate Markdown representation
  const generateMarkdown = () => {
    let md = `# Meeting Agenda: ${agenda.meetingTitle}\n\n`;
    md += `**Objective**: ${agenda.meetingGoal}\n`;
    md += `**Total Duration**: ${agenda.totalDurationMinutes} mins | **Start Time**: ${agenda.startTime}\n\n`;

    md += `## Stakeholders\n`;
    agenda.stakeholders.forEach((s) => {
      md += `- **${s.name}** (${s.role}, ${s.title} - ${s.department})${s.prepNotes ? ` — *Prep*: ${s.prepNotes}` : ''}\n`;
    });

    md += `\n## Timeline & Agenda Topics\n`;
    let prevMinutes = 0;
    agenda.topics.forEach((t, i) => {
      const slot = calculateTimeSlot(startBaseMinutes + prevMinutes, t.durationMinutes);
      prevMinutes += t.durationMinutes;

      md += `### ${i + 1}. [${slot.startStr} - ${slot.endStr}] ${t.title} (${t.durationMinutes}m)\n`;
      md += `- **Presenter**: ${t.presenterName} | **Type**: ${t.purpose}\n`;
      if (t.description) md += `- **Overview**: ${t.description}\n`;
      if (t.keyQuestions && t.keyQuestions.length > 0) {
        md += `- **Key Questions**:\n`;
        t.keyQuestions.forEach((q) => (md += `  - ${q}\n`));
      }
      if (t.expectedOutcome) md += `- **Deliverable**: ${t.expectedOutcome}\n`;
      if (t.notes) md += `- **Meeting Notes**: ${t.notes}\n`;
      md += `\n`;
    });

    if (agenda.keyDecisionsNeeded && agenda.keyDecisionsNeeded.length > 0) {
      md += `## Key Decisions to Finalize\n`;
      agenda.keyDecisionsNeeded.forEach((d) => (md += `- [ ] ${d}\n`));
      md += `\n`;
    }

    if (agenda.actionItems && agenda.actionItems.length > 0) {
      md += `## Action Items & Ownership\n`;
      agenda.actionItems.forEach((a) => (md += `- [${a.completed ? 'x' : ' '}] **${a.assignee}**: ${a.title}\n`));
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate .ics calendar invite file
  const handleDownloadICS = () => {
    const title = agenda.meetingTitle;
    const description = generateMarkdown().replace(/\n/g, '\\n');
    const now = new Date();
    const startTimeParts = (agenda.startTime || '10:00 AM').split(/[:\s]/);
    let hours = parseInt(startTimeParts[0], 10);
    const minutes = parseInt(startTimeParts[1], 10);
    const isPM = (agenda.startTime || '').includes('PM');
    if (isPM && hours < 12) hours += 12;

    const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    const endDateTime = new Date(startDateTime.getTime() + agenda.totalDurationMinutes * 60 * 1000);

    const formatICSDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AgendaCraft//Meeting Builder//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(endDateTime)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${agenda.meetingTitle.replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Export Meeting Agenda</h3>
              <p className="text-xs text-zinc-500">Copy to Slack/Notion or download .ics Calendar event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadICS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Download .ICS Invite</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-400" />
            <span>Print View</span>
          </button>
        </div>

        {/* Markdown preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700">Agenda Preview (Markdown):</label>
          <pre className="max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed select-all">
            {generateMarkdown()}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

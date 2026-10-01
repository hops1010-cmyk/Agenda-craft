import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileType, 
  Sparkles, 
  Clock, 
  Sliders, 
  Layers, 
  Check, 
  AlertCircle, 
  Trash2, 
  ChevronRight,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { SAMPLE_DOCS, SampleDoc } from '../data/sampleDocs';
import { MeetingAgenda, MeetingType } from '../types/agenda';

interface LeftUploadPanelProps {
  onGenerate: (payload: {
    documentText?: string;
    documentBase64?: string;
    mimeType?: string;
    fileName?: string;
    targetDuration: number;
    meetingType: MeetingType;
    focusNotes?: string;
  }) => Promise<void>;
  isLoading: boolean;
  activeAgenda: MeetingAgenda | null;
  savedAgendas: MeetingAgenda[];
  onSelectSavedAgenda: (agenda: MeetingAgenda) => void;
  onDeleteSavedAgenda: (id: string) => void;
}

export const LeftUploadPanel: React.FC<LeftUploadPanelProps> = ({
  onGenerate,
  isLoading,
  activeAgenda,
  savedAgendas,
  onSelectSavedAgenda,
  onDeleteSavedAgenda,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('samples');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<SampleDoc>(SAMPLE_DOCS[0]);
  const [targetDuration, setTargetDuration] = useState<number>(45);
  const [meetingType, setMeetingType] = useState<MeetingType>('decision');
  const [focusNotes, setFocusNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const processFile = (uploadedFile: File) => {
    setErrorMsg(null);
    setFile(uploadedFile);

    const reader = new FileReader();

    // Check if plain text / markdown / csv / json
    const isText = 
      uploadedFile.type.startsWith('text/') || 
      uploadedFile.name.endsWith('.txt') || 
      uploadedFile.name.endsWith('.md') || 
      uploadedFile.name.endsWith('.csv') || 
      uploadedFile.name.endsWith('.json');

    if (isText) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPastedText(text);
        setFileBase64(null);
      };
      reader.readAsText(uploadedFile);
    } else {
      // PDF or binary / image
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFileBase64(dataUrl);
        setPastedText('');
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
      setActiveTab('upload');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleGenerateClick = async () => {
    setErrorMsg(null);
    try {
      if (activeTab === 'upload') {
        if (!file && !pastedText && !fileBase64) {
          setErrorMsg('Please select or drop a document first.');
          return;
        }
        await onGenerate({
          documentText: pastedText || undefined,
          documentBase64: fileBase64 || undefined,
          mimeType: file?.type || 'application/pdf',
          fileName: file?.name || 'Uploaded Document',
          targetDuration,
          meetingType,
          focusNotes,
        });
      } else if (activeTab === 'paste') {
        if (!pastedText.trim()) {
          setErrorMsg('Please paste your document text.');
          return;
        }
        await onGenerate({
          documentText: pastedText,
          fileName: 'Pasted Notes / Document',
          targetDuration,
          meetingType,
          focusNotes,
        });
      } else {
        // Samples
        await onGenerate({
          documentText: selectedSample.content,
          fileName: selectedSample.name,
          targetDuration: targetDuration || selectedSample.targetDuration,
          meetingType,
          focusNotes,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to synthesize agenda');
    }
  };

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-r border-zinc-200 bg-white flex flex-col h-[calc(100vh-4rem)]">
      {/* Panel Top Title */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Document Input</h2>
            <p className="text-[11px] text-zinc-500">Extracts stakeholders & builds timeline</p>
          </div>
        </div>

        {savedAgendas.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
              showHistory 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <FolderOpen className="h-3 w-3" />
            <span>History ({savedAgendas.length})</span>
          </button>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Saved Agendas Drawer/Dropdown if open */}
        {showHistory && savedAgendas.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>Saved Agendas</span>
              <span className="text-[10px] text-zinc-400">Stored locally</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {savedAgendas.map((saved) => (
                <div
                  key={saved.id}
                  onClick={() => {
                    onSelectSavedAgenda(saved);
                    setShowHistory(false);
                  }}
                  className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                    activeAgenda?.id === saved.id
                      ? 'bg-white border-indigo-200 text-indigo-900 shadow-xs'
                      : 'bg-white/80 border-zinc-200/80 hover:bg-white text-zinc-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium truncate">{saved.meetingTitle}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>{saved.totalDurationMinutes}m</span>
                      <span>•</span>
                      <span>{saved.topics.length} topics</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSavedAgenda(saved.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-opacity"
                    title="Delete saved agenda"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Mode Tabs */}
        <div className="flex rounded-lg bg-zinc-100 p-1 border border-zinc-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'samples'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Sample Docs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-zinc-500" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-zinc-500" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Tab 1: Sample Documents (Quick 1-click test) */}
        {activeTab === 'samples' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700">Choose a Pre-loaded Document:</label>
            <div className="space-y-2">
              {SAMPLE_DOCS.map((doc) => {
                const isSelected = selectedSample.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedSample(doc);
                      setTargetDuration(doc.targetDuration);
                      setMeetingType(doc.meetingType);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-white text-indigo-600 border border-zinc-200">
                          <FileType className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-semibold text-zinc-900">{doc.name}</span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-200">
                        {doc.targetDuration}m
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-500 line-clamp-2">
                      {doc.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="font-medium text-zinc-600">{doc.category}</span>
                      <span>•</span>
                      <span className="capitalize">{doc.meetingType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload File (Drag & Drop) */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg"
              className="hidden"
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/40 hover:bg-zinc-50'
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-zinc-200">
                {file ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Upload className="h-5 w-5 text-zinc-600" />
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-800">
                {file ? file.name : 'Click or drag doc here'}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB • Ready to analyze`
                  : 'PDF, Word (.docx), Markdown, TXT, CSV, Images'}
              </p>

              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileBase64(null);
                    setPastedText('');
                  }}
                  className="mt-2 text-[11px] text-red-500 hover:underline"
                >
                  Remove file
                </button>
              )}
            </div>

            <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/70 text-[11px] text-zinc-600 flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Gemini 3.8 Flash automatically parses PDFs, tables, schemas, and bullet points to generate the full timeline and stakeholder map.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Paste Raw Text */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">Paste Document or Meeting Notes:</label>
              <span className="text-[10px] text-zinc-400">
                {pastedText.length > 0 ? `${pastedText.split(/\s+/).length} words` : ''}
              </span>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste PRD text, RFC document, sprint notes, executive briefing, or project status..."
              rows={8}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Meeting Configuration Controls */}
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
            <Sliders className="h-3.5 w-3.5 text-zinc-500" />
            <span>Meeting Parameters</span>
          </div>

          {/* Target Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600">Target Duration:</label>
              <span className="text-xs font-bold text-zinc-900">{targetDuration} min</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 30, 45, 60, 90].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setTargetDuration(dur)}
                  className={`py-1.5 text-xs rounded-lg font-medium border transition-all ${
                    targetDuration === dur
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Type Selector */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 block mb-1.5">Primary Objective:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'decision', label: 'Decision-Making' },
                { id: 'review', label: 'Strategic Review' },
                { id: 'brainstorm', label: 'Brainstorming' },
                { id: 'kickoff', label: 'Project Kickoff' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMeetingType(type.id as MeetingType)}
                  className={`py-1.5 px-2 text-xs rounded-lg text-left truncate font-medium border transition-all ${
                    meetingType === type.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Focus Directives */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 block mb-1">
              Custom Focus / Constraints (Optional):
            </label>
            <input
              type="text"
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              placeholder="e.g. Prioritize budget approval & leave 10m for Q&A"
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.2" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Panel Bottom Action */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGenerateClick}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
            isLoading
              ? 'bg-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] shadow-zinc-200'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing Doc with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-300" />
              <span>Generate Meeting Timeline</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </>
          )}
        </button>

        <div className="mt-2 text-center">
          <span className="text-[10px] text-zinc-400">
            Powered by Gemini 3.8 Flash • Builds Timeline & Stakeholders
          </span>
        </div>
      </div>
    </aside>
  );
};

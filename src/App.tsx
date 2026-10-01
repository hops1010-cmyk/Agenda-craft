import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftUploadPanel } from './components/LeftUploadPanel';
import { CentralArea } from './components/CentralArea';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveMeetingModal } from './components/LiveMeetingModal';
import { ExportModal } from './components/ExportModal';
import { MeetingAgenda, MeetingType } from './types/agenda';
import { SAMPLE_DOCS } from './data/sampleDocs';

const STORAGE_KEY = 'agendacraft_saved_agendas_v1';

export default function App() {
  const [activeAgenda, setActiveAgenda] = useState<MeetingAgenda | null>(null);
  const [savedAgendas, setSavedAgendas] = useState<MeetingAgenda[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load saved agendas from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAgendas(parsed);
          setActiveAgenda(parsed[0]);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load agendas from localStorage', e);
    }

    // Default seed agenda from sample doc on first visit
    handleGenerate({
      documentText: SAMPLE_DOCS[0].content,
      fileName: SAMPLE_DOCS[0].name,
      targetDuration: SAMPLE_DOCS[0].targetDuration,
      meetingType: SAMPLE_DOCS[0].meetingType,
      focusNotes: 'Synthesize balanced timeline and stakeholder responsibilities',
    });
  }, []);

  // Save agendas to localStorage whenever updated
  const persistAgendas = (agendas: MeetingAgenda[]) => {
    setSavedAgendas(agendas);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agendas));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  };

  // Handler to generate agenda from doc
  const handleGenerate = async (payload: {
    documentText?: string;
    documentBase64?: string;
    mimeType?: string;
    fileName?: string;
    targetDuration: number;
    meetingType: MeetingType;
    focusNotes?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const newAgenda: MeetingAgenda = await response.json();
      setActiveAgenda(newAgenda);

      // Save to saved list
      const updatedList = [
        newAgenda,
        ...savedAgendas.filter((a) => a.id !== newAgenda.id),
      ].slice(0, 15);
      persistAgendas(updatedList);
      showToast('Agenda & Timeline successfully synthesized!');
    } catch (err: any) {
      console.error('Generation error:', err);
      showToast('Error generating agenda. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update current active agenda
  const handleUpdateAgenda = (updatedAgenda: MeetingAgenda) => {
    setActiveAgenda(updatedAgenda);
    const updatedList = savedAgendas.map((a) =>
      a.id === updatedAgenda.id ? updatedAgenda : a
    );
    persistAgendas(updatedList);
  };

  // Select saved agenda from history
  const handleSelectSavedAgenda = (agenda: MeetingAgenda) => {
    setActiveAgenda(agenda);
    showToast(`Loaded "${agenda.meetingTitle}"`);
  };

  // Delete saved agenda
  const handleDeleteSavedAgenda = (id: string) => {
    const filtered = savedAgendas.filter((a) => a.id !== id);
    persistAgendas(filtered);
    if (activeAgenda?.id === id) {
      setActiveAgenda(filtered[0] || null);
    }
    showToast('Agenda removed from history');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        agenda={activeAgenda}
        onOpenLiveMode={() => setIsLiveModeOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Main Body: Left Upload Panel + Central Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel for Document Uploads & Settings */}
        <LeftUploadPanel
          onGenerate={handleGenerate}
          isLoading={isLoading}
          activeAgenda={activeAgenda}
          savedAgendas={savedAgendas}
          onSelectSavedAgenda={handleSelectSavedAgenda}
          onDeleteSavedAgenda={handleDeleteSavedAgenda}
        />

        {/* Central Area: Timeline, Topics & Stakeholders */}
        <CentralArea
          agenda={activeAgenda}
          onUpdateAgenda={handleUpdateAgenda}
          onOpenLiveMode={() => setIsLiveModeOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Multi-turn Gemini Chatbot Slide-over */}
      <GeminiChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        agenda={activeAgenda}
      />

      {/* Live Meeting Runner Modal */}
      {isLiveModeOpen && activeAgenda && (
        <LiveMeetingModal
          isOpen={isLiveModeOpen}
          onClose={() => setIsLiveModeOpen(false)}
          agenda={activeAgenda}
          onUpdateAgenda={handleUpdateAgenda}
        />
      )}

      {/* Export / Share Modal */}
      {isExportOpen && activeAgenda && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          agenda={activeAgenda}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

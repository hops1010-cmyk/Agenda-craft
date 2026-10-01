export type MeetingType = 
  | 'decision' 
  | 'brainstorm' 
  | 'review' 
  | 'kickoff' 
  | 'standup' 
  | 'workshop';

export type StakeholderRole = 
  | 'Organizer' 
  | 'Decision Maker' 
  | 'Presenter' 
  | 'Contributor' 
  | 'Key Stakeholder'
  | 'Observer';

export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  title: string;
  department: string;
  email?: string;
  prepNotes?: string;
  avatarColor: string;
}

export type TopicPurpose = 
  | 'decision' 
  | 'discussion' 
  | 'presentation' 
  | 'alignment' 
  | 'action_items';

export interface AgendaTopic {
  id: string;
  title: string;
  durationMinutes: number;
  presenterId: string;
  presenterName: string;
  purpose: TopicPurpose;
  description: string;
  keyQuestions: string[];
  expectedOutcome: string;
  tag: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate?: string;
  completed: boolean;
  topicTitle?: string;
}

export interface MeetingAgenda {
  id: string;
  meetingTitle: string;
  meetingGoal: string;
  totalDurationMinutes: number;
  targetDurationMinutes: number;
  startTime: string; // e.g. "10:00 AM"
  meetingType: MeetingType;
  tags: string[]; // e.g. ['Internal', 'Client', 'Engineering']
  sourceDocName?: string;
  sourceDocSnippet?: string;
  stakeholders: Stakeholder[];
  topics: AgendaTopic[];
  keyDecisionsNeeded: string[];
  prepChecklist: { id: string; owner: string; task: string; completed: boolean }[];
  actionItems: ActionItem[];
  risksOrWatchouts?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: 'adjust_duration' | 'add_topic' | 'reassign_presenter' | 'update_agenda';
    label: string;
    payload?: any;
  };
}

export type ChatRole = 'facilitator' | 'challenger' | 'optimizer' | 'scribe';

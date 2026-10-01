import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper colors for stakeholder avatars
const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-indigo-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
  'bg-teal-500 text-white',
];

// Helper fallback generator if API key is missing or model throws an unexpected error
function generateFallbackAgenda(documentText: string, targetDuration: number, meetingType: string, customTags?: string[]) {
  const titleMatch = documentText.match(/#+\s*(.+)/) || documentText.match(/([^\n]+)/);
  const detectedTitle = titleMatch ? titleMatch[1].replace(/^[#\*\s]+/, '').trim() : 'Project Alignment Meeting';

  const defaultTopics = [
    {
      id: 'topic-1',
      title: 'Context & Strategic Alignment',
      durationMinutes: Math.max(5, Math.round(targetDuration * 0.15)),
      presenterId: 'stk-1',
      presenterName: 'Meeting Organizer',
      purpose: 'alignment',
      description: 'Review document background, primary goals, and meeting objectives.',
      keyQuestions: ['What are the must-win objectives for this phase?', 'Are all team constraints understood?'],
      expectedOutcome: 'Shared context across all participants with clear boundary lines.',
      tag: 'Alignment',
      status: 'not_started',
    },
    {
      id: 'topic-2',
      title: 'Core Proposal & Technical Walkthrough',
      durationMinutes: Math.max(10, Math.round(targetDuration * 0.4)),
      presenterId: 'stk-2',
      presenterName: 'Lead Architect',
      purpose: 'presentation',
      description: 'Detailed analysis of proposed architecture, implementation tradeoffs, and resource needs.',
      keyQuestions: ['What are the key technical dependencies?', 'What fallback options exist if milestones slip?'],
      expectedOutcome: 'Consensus on architecture direction and technical scope.',
      tag: 'Review',
      status: 'not_started',
    },
    {
      id: 'topic-3',
      title: 'Key Decision Points & Resource Commitment',
      durationMinutes: Math.max(10, Math.round(targetDuration * 0.3)),
      presenterId: 'stk-3',
      presenterName: 'Executive Sponsor',
      purpose: 'decision',
      description: 'Debate trade-offs, approve budget allocations, and establish go/no-go criteria.',
      keyQuestions: ['Do we approve the proposed budget and headcount?', 'What are the unacceptable risk thresholds?'],
      expectedOutcome: 'Signed-off decision record with explicit sponsor authorization.',
      tag: 'Decision',
      status: 'not_started',
    },
    {
      id: 'topic-4',
      title: 'Action Items, Ownership & Next Steps',
      durationMinutes: Math.max(5, Math.round(targetDuration * 0.15)),
      presenterId: 'stk-1',
      presenterName: 'Meeting Organizer',
      purpose: 'action_items',
      description: 'Assign clear deliverables, deadlines, and schedule the next milestone check-in.',
      keyQuestions: ['Who owns each follow-up task?', 'When is the next milestone checkpoint?'],
      expectedOutcome: 'Finalized action items table with assigned dates and owners.',
      tag: 'Action Items',
      status: 'not_started',
    },
  ];

  // Adjust durations so sum equals targetDuration
  const sumTopics = defaultTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
  const diff = targetDuration - sumTopics;
  if (diff !== 0) {
    defaultTopics[1].durationMinutes += diff;
  }

  return {
    id: 'agenda-' + Date.now(),
    meetingTitle: `${detectedTitle} - Action Agenda`,
    meetingGoal: `Achieve cross-functional alignment and formal sign-off on the roadmap outlined in the source document.`,
    totalDurationMinutes: targetDuration,
    targetDurationMinutes: targetDuration,
    startTime: '10:00 AM',
    meetingType: meetingType || 'decision',
    tags: customTags && customTags.length > 0 ? customTags : ['Internal', 'Engineering', 'Strategic'],
    stakeholders: [
      {
        id: 'stk-1',
        name: 'Alex Rivera',
        role: 'Organizer',
        title: 'Lead Product Manager',
        department: 'Product',
        prepNotes: 'Send out pre-read deck 24 hours prior; enforce 5-min cap on opening remarks.',
        avatarColor: AVATAR_COLORS[0],
      },
      {
        id: 'stk-2',
        name: 'Jordan Lee',
        role: 'Presenter',
        title: 'Staff Architect',
        department: 'Engineering',
        prepNotes: 'Prepare 3-slide diagram of data pipelines and integration latency benchmarks.',
        avatarColor: AVATAR_COLORS[1],
      },
      {
        id: 'stk-3',
        name: 'Taylor Brooks',
        role: 'Decision Maker',
        title: 'VP Operations',
        department: 'Leadership',
        prepNotes: 'Review requested Q3 budget allocations and risk tolerance criteria.',
        avatarColor: AVATAR_COLORS[2],
      },
      {
        id: 'stk-4',
        name: 'Casey Morgan',
        role: 'Key Stakeholder',
        title: 'Director of Compliance',
        department: 'Security & Legal',
        prepNotes: 'Validate data residency and audit logging compliance requirements.',
        avatarColor: AVATAR_COLORS[3],
      },
    ],
    topics: defaultTopics,
    keyDecisionsNeeded: [
      'Approval of primary vendor / framework architecture',
      'Sign-off on $280k infrastructure and compute budget',
      'Allocation of 3 dedicated engineering resources for Q3',
    ],
    prepChecklist: [
      { id: 'prep-1', owner: 'Alex Rivera', task: 'Distribute pre-read document and highlight sections 2 & 4', completed: true },
      { id: 'prep-2', owner: 'Jordan Lee', task: 'Prepare architectural diagram and latency benchmarks', completed: false },
      { id: 'prep-3', owner: 'Taylor Brooks', task: 'Verify Q3 departmental budget surplus allocation', completed: false },
    ],
    actionItems: [
      { id: 'act-1', title: 'Publish finalized architecture decision record (ADR)', assignee: 'Jordan Lee', completed: false },
      { id: 'act-2', title: 'Schedule sprint planning for M1 vector indexing pipeline', assignee: 'Alex Rivera', completed: false },
    ],
    risksOrWatchouts: [
      'Scope creep if open-ended discussions exceed the allotted 45 minutes.',
      'Lack of legal sign-off could delay rollout to production clusters.',
    ],
  };
}

// 1. Endpoint: Generate Agenda from Document
app.post('/api/generate-agenda', async (req, res) => {
  try {
    const {
      documentText,
      documentBase64,
      mimeType,
      fileName,
      targetDuration = 45,
      meetingType = 'decision',
      tags,
      focusNotes = '',
    } = req.body;

    if (!documentText && !documentBase64) {
      return res.status(400).json({ error: 'Please provide either documentText or a document file.' });
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Using rich fallback agenda synthesis.');
      const fallback = generateFallbackAgenda(documentText || 'Project Overview', Number(targetDuration), meetingType, tags);
      return res.json(fallback);
    }

    const targetMinutes = Number(targetDuration) || 45;

    const systemPrompt = `You are an elite Executive Meeting Strategist & Agenda Designer.
Your task is to analyze the provided document and synthesize an exceptionally well-structured, realistic, and timeboxed meeting agenda.

CRITICAL INSTRUCTIONS:
1. TARGET DURATION: Exactly ${targetMinutes} minutes total. The sum of all topic durations MUST equal exactly ${targetMinutes} minutes!
2. MEETING TYPE: ${meetingType}.
3. TAGS: Classify the meeting with 2 to 4 high-level categorization tags (e.g. "Internal", "Client", "Engineering", "Executive", "Product", "Operations", "Sales", "Security", etc.). ${tags && tags.length > 0 ? `Include or prioritize these requested tags: ${JSON.stringify(tags)}.` : ''}
4. FOCUS NOTES: ${focusNotes ? focusNotes : 'None provided'}.
5. STAKEHOLDERS: Identify 3 to 6 key stakeholders (name, role, job title, department, specific prep notes).
   - Give each a role: "Organizer", "Decision Maker", "Presenter", "Contributor", "Key Stakeholder", or "Observer".
   - Suggest concrete pre-meeting tasks or required reading for each.
6. TOPICS & TIMELINE:
   - Provide 3 to 7 sequential agenda topics that logically flow to solve the document's objectives.
   - For EACH topic:
     - Assign an exact duration in minutes (e.g. 5, 10, 15, 20).
     - Assign a primary presenter (must match one of the stakeholders).
     - State the primary purpose: 'decision', 'discussion', 'presentation', 'alignment', or 'action_items'.
     - Provide 2-3 razor-sharp key questions that must be addressed during this slot.
     - State the expected deliverable/outcome of this time block.
7. KEY DECISIONS: List 2-4 concrete go/no-go decisions or sign-offs needed.
8. PREP CHECKLIST: 3-5 specific pre-meeting tasks with owner names.
9. RISKS / WATCHOUTS: 2-3 potential pitfalls (e.g. rabbit holes, contentious points).

Return strictly JSON matching this structure:
{
  "meetingTitle": "Descriptive, executive title",
  "meetingGoal": "Clear 1-2 sentence primary objective of the meeting",
  "totalDurationMinutes": ${targetMinutes},
  "targetDurationMinutes": ${targetMinutes},
  "startTime": "10:00 AM",
  "meetingType": "${meetingType}",
  "tags": ["Internal", "Engineering"],
  "stakeholders": [
    {
      "id": "stk-1",
      "name": "Full Name",
      "role": "Organizer" | "Decision Maker" | "Presenter" | "Contributor" | "Key Stakeholder",
      "title": "Job Title",
      "department": "Engineering | Product | Leadership | Finance | etc.",
      "prepNotes": "Actionable pre-meeting task"
    }
  ],
  "topics": [
    {
      "id": "topic-1",
      "title": "Topic Title",
      "durationMinutes": 10,
      "presenterName": "Matching Stakeholder Name",
      "purpose": "decision" | "discussion" | "presentation" | "alignment" | "action_items",
      "description": "Brief description of the topic",
      "keyQuestions": ["Question 1?", "Question 2?"],
      "expectedOutcome": "Deliverable or resolution",
      "tag": "Short Category Tag",
      "status": "not_started"
    }
  ],
  "keyDecisionsNeeded": ["Decision 1", "Decision 2"],
  "prepChecklist": [
    {
      "id": "prep-1",
      "owner": "Stakeholder Name",
      "task": "Task description",
      "completed": false
    }
  ],
  "actionItems": [
    {
      "id": "act-1",
      "title": "Immediate follow-up task",
      "assignee": "Stakeholder Name",
      "completed": false
    }
  ],
  "risksOrWatchouts": ["Risk 1", "Risk 2"]
}`;

    let contentsPayload: any;
    if (documentBase64 && mimeType) {
      const cleanBase64 = documentBase64.replace(/^data:[^;]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this uploaded file "${fileName || 'document'}" and generate the structured meeting agenda.\nTarget Duration: ${targetMinutes} minutes.\nMeeting Type: ${meetingType}.\nUser Focus: ${focusNotes || 'Standard comprehensive agenda'}`,
          },
        ],
      };
    } else {
      contentsPayload = `Document Content:\n\n${documentText.slice(0, 50000)}\n\nGenerate the complete structured meeting agenda following the system instructions.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawJson = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Try extracting json code block
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Gemini JSON output');
      }
    }

    // Attach ids and colors
    parsed.id = 'agenda-' + Date.now();
    parsed.sourceDocName = fileName || 'Uploaded Document';
    parsed.sourceDocSnippet = (documentText || '').slice(0, 300);

    // Sanitize and set tags
    if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
      parsed.tags = parsed.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (Array.isArray(tags) && tags.length > 0) {
      parsed.tags = tags;
    } else {
      parsed.tags = ['Internal', 'Engineering'];
    }

    // Map stakeholder avatar colors and IDs
    const stakeholderMap: Record<string, string> = {};
    if (Array.isArray(parsed.stakeholders)) {
      parsed.stakeholders.forEach((s: any, idx: number) => {
        if (!s.id) s.id = `stk-${idx + 1}`;
        s.avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
        stakeholderMap[s.name] = s.id;
      });
    }

    // Ensure presenter IDs match stakeholders
    if (Array.isArray(parsed.topics)) {
      parsed.topics.forEach((t: any, idx: number) => {
        if (!t.id) t.id = `topic-${idx + 1}`;
        if (!t.presenterId) {
          t.presenterId = stakeholderMap[t.presenterName] || (parsed.stakeholders?.[0]?.id ?? 'stk-1');
        }
        if (!t.status) t.status = 'not_started';
      });

      // Recalculate duration sum and adjust last/largest item if needed to hit exact target
      const currentSum = parsed.topics.reduce((sum: number, t: any) => sum + (Number(t.durationMinutes) || 0), 0);
      const diff = targetMinutes - currentSum;
      if (diff !== 0 && parsed.topics.length > 0) {
        // Adjust the longest topic
        let longestIndex = 0;
        let maxDuration = 0;
        parsed.topics.forEach((t: any, i: number) => {
          if (t.durationMinutes > maxDuration) {
            maxDuration = t.durationMinutes;
            longestIndex = i;
          }
        });
        parsed.topics[longestIndex].durationMinutes = Math.max(5, parsed.topics[longestIndex].durationMinutes + diff);
      }
    }

    parsed.totalDurationMinutes = targetMinutes;
    parsed.targetDurationMinutes = targetMinutes;

    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating agenda with Gemini:', error);
    // Return high-quality fallback so the user experience is smooth
    const fallback = generateFallbackAgenda(req.body.documentText || 'Project Overview', Number(req.body.targetDuration) || 45, req.body.meetingType || 'decision');
    res.json(fallback);
  }
});

// 2. Endpoint: Multi-Turn Gemini Meeting Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      role = 'facilitator',
      agendaContext,
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Role-specific persona instructions
    let roleInstruction = '';
    switch (role) {
      case 'challenger':
        roleInstruction = `You are the "Executive Challenger" (Devil's Advocate) for this meeting.
Your role is to rigorously stress-test the meeting plan, spot hidden assumptions, point out unaddressed technical/financial risks, and challenge whether the allocated time for tough topics is sufficient or if attendees will avoid the elephant in the room. Be constructive, razor-sharp, and direct.`;
        break;
      case 'optimizer':
        roleInstruction = `You are the "Agenda Optimizer & Timebox Coach".
Your mission is to make this meeting ultra-efficient. Look for topics that can be moved to asynchronous pre-reads, suggest cutting or compressing bloated topics, protect executive focus, and optimize speaking balance across participants. Propose precise minute adjustments (e.g., "-10m on intro, +5m on decision").`;
        break;
      case 'scribe':
        roleInstruction = `You are the "Executive Scribe & Action Extractor".
Your role is to summarize outcomes, synthesize key decisions into clear language, formulate accountability commitments (who does what by when), and draft follow-up communications or calendar invitations.`;
        break;
      case 'facilitator':
      default:
        roleInstruction = `You are the "Meeting Facilitator & Host".
Your role is to guide the meeting to success: keep attendees on topic, suggest pacing strategies, intervene on potential rabbit holes, suggest opening icebreakers or framing questions, and ensure every key stakeholder has an opportunity to speak.`;
        break;
    }

    const contextSummary = agendaContext
      ? `CURRENT MEETING CONTEXT:
Title: ${agendaContext.meetingTitle || 'Meeting'}
Tags: ${(agendaContext.tags || []).join(', ')}
Goal: ${agendaContext.meetingGoal || 'N/A'}
Total Duration: ${agendaContext.totalDurationMinutes || 45} mins
Stakeholders: ${(agendaContext.stakeholders || []).map((s: any) => `${s.name} (${s.role}, ${s.title})`).join(', ')}
Topics: ${(agendaContext.topics || []).map((t: any, i: number) => `${i + 1}. [${t.durationMinutes}m] ${t.title} (${t.presenterName})`).join('; ')}
Key Decisions: ${(agendaContext.keyDecisionsNeeded || []).join(', ')}`
      : 'No agenda loaded yet.';

    const systemInstruction = `${roleInstruction}

${contextSummary}

GUIDELINES:
- Provide concise, highly actionable, bulleted advice.
- When suggesting concrete agenda modifications (e.g. shortening a topic, reassigning a presenter, adding a buffer), formulate it clearly so the user can take immediate action.
- Be encouraging, professional, and clear.`;

    if (!ai) {
      // Mock conversational response if API key is not present
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        reply: `[${role.toUpperCase()} MODE]: I reviewed your agenda for "${agendaContext?.meetingTitle || 'the meeting'}". Regarding "${lastUserMsg}":\n\n1. **Pacing Recommendation**: Keep the presentation portion tightly bounded to 15 minutes to guarantee at least 20 minutes for cross-functional debate.\n2. **Stakeholder Engagement**: Ensure the key decision maker has pre-read the summary section so time isn't spent rehashing basic data.\n3. **Deliverable Check**: Conclude with a verbal recap of owners and deadlines 5 minutes before the scheduled finish.`,
      });
    }

    // Select model specified or fallback to gemini-3.8-flash
    const targetModel = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'].includes(model)
      ? model
      : 'gemini-3.8-flash';

    // Format contents history for Gemini SDK
    // The SDK accepts contents as an array of Content objects: { role: 'user' | 'model', parts: [{ text: ... }] }
    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I analyzed the agenda and have no additional notes.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in Gemini Chatbot API:', error);
    res.status(500).json({
      error: error?.message || 'Chat generation failed',
      reply: 'I encountered an issue processing that query. Please check that your agenda is properly loaded and try again.',
    });
  }
});

// 3. Endpoint: Quick Refine Agenda with Gemini
app.post('/api/refine-agenda', async (req, res) => {
  try {
    const { agenda, command } = req.body;
    if (!agenda || !command) {
      return res.status(400).json({ error: 'Agenda and command are required.' });
    }

    if (!ai) {
      // Simple fallback modification
      const modified = { ...agenda };
      if (command.includes('30')) {
        modified.totalDurationMinutes = 30;
        modified.targetDurationMinutes = 30;
        modified.topics = modified.topics.map((t: any) => ({
          ...t,
          durationMinutes: Math.max(5, Math.round(t.durationMinutes * 0.6)),
        }));
      }
      return res.json(modified);
    }

    const prompt = `You are an expert Meeting Facilitator.
Current Agenda JSON:
${JSON.stringify(agenda, null, 2)}

User's requested modification: "${command}"

Apply this requested modification to the agenda.
Make sure the duration numbers add up, stakeholder assignments remain consistent, and the structure is preserved.
Return ONLY valid JSON matching the full MeetingAgenda schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawJson = response.text || '';
    const parsed = JSON.parse(rawJson);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error refining agenda:', error);
    res.status(500).json({ error: 'Failed to refine agenda.' });
  }
});

// Setup Vite middlewares for development, or serve static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();

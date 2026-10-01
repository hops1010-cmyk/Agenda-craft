export interface SampleDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  targetDuration: number;
  meetingType: 'decision' | 'brainstorm' | 'review' | 'kickoff' | 'workshop';
  tags: string[];
  content: string;
}

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'prd-ai-copilot',
    name: 'Enterprise AI Search PRD v2.4.docx',
    category: 'Product & Engineering',
    description: 'Product Requirements Document for launching an internal AI Knowledge Assistant across 12,000 employees.',
    targetDuration: 45,
    meetingType: 'decision',
    tags: ['Internal', 'Engineering', 'Product'],
    content: `# Product Requirements Document: Enterprise AI Knowledge Search (Project Helios)
Target Release: Q4 2026
Author: Maya Lin (Lead Product Manager)
Stakeholders: David Chen (VP Engineering), Sophia Rossi (Chief Information Security Officer), Marcus Vance (Director of Finance), Liam O'Connor (Principal Solutions Architect)

## 1. Executive Summary
Enterprise teams spend an average of 4.2 hours per week searching for internal documentation, API specs, and compliance policies across Notion, Google Drive, Jira, and Slack. Project Helios introduces a unified semantic vector search with real-time permissions check and multi-source citation.

## 2. Strategic Objectives & Key Results (OKRs)
- Reduce internal search latency from 14 minutes average per query to under 15 seconds.
- Achieve 75% weekly active adoption across Engineering and Customer Support within 90 days.
- Zero data leakage between restricted department vaults (Legal, HR, Exec).

## 3. High-Priority Decision Items Needed from this Meeting:
1. Vendor Architecture Decision: Self-hosted open weights model on AWS vs managed Google Cloud Vertex/Gemini Enterprise API.
2. Q3 Engineering Resource Allocation: Shift 3 backend engineers from Legacy Sync service to vector pipeline indexing.
3. Budget Approval: $280,000 cloud infrastructure and token budget for initial 6-month ramp.
4. Security & Compliance Sign-off: Policy for air-gapped PII redaction prior to prompt synthesis.

## 4. Key Milestones & Proposed Timeline
- M1 (Nov 1): Indexing pipeline MVP for Confluence and GitHub Wiki.
- M2 (Dec 15): Internal Alpha for 200 engineers.
- M3 (Jan 30): Company-wide General Availability.

## 5. Known Risks & Open Questions
- Security: What is the fail-safe if an employee queries confidential M&A documents?
- Cost: If token consumption spikes 3x beyond forecast, what throttling mechanism will be enacted?
- Change Management: Department heads must nominate document stewards.`
  },
  {
    id: 'arch-rfc-microservices',
    name: 'RFC-108: Payment Gateway Resiliency & Kafka Event Sourcing.md',
    category: 'Architecture RFC',
    description: 'Technical RFC addressing 99.99% payment uptime SLA and zero duplicate transaction guarantees during traffic spikes.',
    targetDuration: 60,
    meetingType: 'review',
    tags: ['Engineering', 'Architecture', 'Infrastructure'],
    content: `# RFC-108: Payment Gateway Resiliency & Idempotent Event Sourcing
Status: Under Review
Authors: Alex Mercer (Staff Infrastructure Engineer), Priya Patel (Lead Payments Architect)
Target Audience: Billing Team, Site Reliability Engineering, FinTech Compliance

## Problem Statement
During Black Friday 2025, our legacy monolithic payment processing engine experienced a 4-minute database lock contention, resulting in 420 dropped transactions and 18 duplicate charges requiring manual refund reconciliation. Our target is five-nines (99.999%) availability and absolute idempotency.

## Proposed Architecture
1. Event Sourcing with Apache Kafka & Outbox Pattern:
   - Payment requests are written to an append-only transaction ledger with cryptographically signed idempotency keys.
   - Kafka partition keys hashed by merchant ID to preserve causal ordering.
2. Dual-Acquirer Fallback Routing:
   - Primary: Stripe API. Automatic sub-second failover to Adyen if p99 latency > 1200ms or 5xx error rate exceeds 1.5%.
3. Circuit Breakers & Dead-Letter Queues (DLQ):
   - Graceful degradation mode with optimistic authorization holds for trusted accounts.

## Critical Discussion Points
- Migration Strategy: Blue/Green cutover vs incremental 5% traffic shadow run.
- Latency Overhead: Kafka event ledger adds ~14ms per authorization hop; is this acceptable to the mobile checkout team?
- Disaster Recovery drill schedule: SRE team requires full failover rehearsal in Staging.`
  },
  {
    id: 'gtm-sales-quarterly',
    name: 'Q3 Enterprise Sales Strategy & Territory Realignment.pdf',
    category: 'Sales & Revenue',
    description: 'Quarterly business review focusing on $14M ARR pipeline, EMEA expansion, and pricing adjustments.',
    targetDuration: 45,
    meetingType: 'review',
    tags: ['Client', 'Executive', 'Sales'],
    content: `# Executive Brief: Q3 Enterprise GTM Strategy & Territory Realignment
Presenter: Elena Rostova (Chief Revenue Officer)
Attendees: VP Sales EMEA, Head of Customer Success, Director of RevOps, CMO

## 1. Q2 Performance Recap
- Total ARR: $11.8M (104% to quota)
- Net Revenue Retention (NRR): 118%
- Average Contract Value (ACV): $48,000 (up 18% YoY)
- Win Rate against primary competitor: 34% (down 4% due to competitor's packaged security bundle)

## 2. Agenda Objectives for Q3 Strategy Alignment
- Reallocate 4 enterprise sales reps from Tier-3 US regional accounts to emerging EMEA and DACH hubs.
- Launch new "Security & Compliance Add-on" SKU at $12,000/year to counter competitor bundling.
- Implement mandatory Customer Success onboarding gate for deals over $100k to curb 6-month churn.

## 3. Bottlenecks Requiring Cross-Functional Action
- Legal contract review time currently averages 11 business days. Need automated standard redlines for contracts under $50k.
- Marketing MQL-to-SQL conversion dropped 6% in Enterprise segment. Marketing requesting stricter sales qualification criteria.`
  },
  {
    id: 'incident-postmortem',
    name: 'Sev-1 Postmortem: Global CDN Cache Poisoning Incident.txt',
    category: 'Postmortem & Ops',
    description: 'Root cause analysis, customer impact assessment, and preventive guardrails after an edge deployment incident.',
    targetDuration: 30,
    meetingType: 'review',
    tags: ['Internal', 'Operations', 'Engineering'],
    content: `# Incident Postmortem: Global API Edge Cache Invalidation Failure
Incident Date: September 18, 2026
Severity: SEV-1
Incident Commander: Daniel Kim (Principal SRE)
Reviewers: VP Infrastructure, Head of Security, Customer Experience Director

## Impact Summary
- Duration: 23 minutes (14:02 UTC - 14:25 UTC)
- Impacted Users: ~14,000 mobile app sessions encountered stale session tokens resulting in intermittent HTTP 401 logouts.
- Financial Impact: Estimated $32,000 in delayed cart checkouts; zero credential compromises.

## Root Cause
A pipeline deployment at 14:01 UTC introduced an unescaped wildcard in the edge CDN cache purge regex rule. This caused Edge POP nodes to serve expired cached authorization responses rather than routing to upstream token validation endpoints.

## Corrective Actions & Ownership
1. SRE: Implement automated Canary deployment with synthetic auth verification before 100% CDN purge rollout (Owner: Daniel Kim, Due: Oct 5).
2. QA: Add automated end-to-end integration tests for edge cache rule changes in CI/CD pipeline (Owner: Sarah Jenkins, Due: Oct 12).
3. CX: Issue proactive communication and service credits to affected enterprise tiers (Owner: Robert Fox, Due: Tomorrow).`
  }
];

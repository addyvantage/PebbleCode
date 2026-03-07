import {
  BookOpen,
  Bot,
  Brain,
  Compass,
  FileText,
  Globe,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export type HelpFaqItem = {
  question: string
  answer: string
}

export type HelpFaqGroup = {
  id: string
  label: string
  title: string
  description: string
  icon: LucideIcon
  items: HelpFaqItem[]
}

export type HelpStep = {
  id: string
  label: string
  title: string
  body: string
  detail: string
  icon: LucideIcon
  chips?: string[]
}

export type HelpQuickPathStep = {
  title: string
  detail: string
}

export const FAQ_GROUPS: HelpFaqGroup[] = [
  {
    id: 'product',
    label: 'Product',
    title: 'What PebbleCode is trying to solve',
    description: 'The big-picture questions judges and first-time users ask first.',
    icon: Sparkles,
    items: [
      {
        question: 'What is PebbleCode?',
        answer:
          'PebbleCode is a recovery-first coding practice workspace. Instead of optimizing only for final acceptance, it is built around the full loop of opening a problem, running code, understanding why it failed, getting guided help, fixing it, and measuring improvement over time.',
      },
      {
        question: 'How is PebbleCode different from a normal coding platform?',
        answer:
          'The product combines a premium IDE-like session, runtime feedback, guided mentor assistance, progress analytics, and a seeded peer-learning layer in one flow. The differentiator is not just “AI answers,” but structured recovery after wrong runs and confusing failures.',
      },
      {
        question: 'Who is PebbleCode for in its current prototype?',
        answer:
          'The current implementation is strongest for student coders, placement-prep learners, and people practicing DSA, SQL, or interview explanation skills. The onboarding and placement flows are tuned to help beginner and intermediate users get to a sensible starting point quickly.',
      },
      {
        question: 'What should a judge notice first in a demo?',
        answer:
          'The core story is that PebbleCode turns coding friction into a guided recovery loop. The most important sequence is: open a problem, run into a failure, use Pebble Coach to understand the failure, rerun, then inspect how Insights and Community extend that learning beyond one attempt.',
      },
    ],
  },
  {
    id: 'coach',
    label: 'AI mentor',
    title: 'How the mentor layer actually behaves',
    description: 'Grounded help, not generic chatbot behavior.',
    icon: Bot,
    items: [
      {
        question: 'What does Pebble Coach do?',
        answer:
          'Pebble Coach sits inside the Session page and uses the current problem, code, run state, failing summary, and help tier to generate grounded guidance. It is designed to stay attached to the exact coding context instead of acting like a detached chat assistant.',
      },
      {
        question: 'Is the AI giving full solutions immediately?',
        answer:
          'Not by default. The mentor UI is designed around progressive help such as hint, explain, and next-step guidance. The repo also contains a richer agent-style path for more structured answers, but the product direction is still to support autonomy first rather than dumping a finished answer immediately.',
      },
      {
        question: 'How does the recovery loop work?',
        answer:
          'A user runs or submits code, sees testcase-level feedback, then uses the coach rail to interpret the failure. That response can be used to make a targeted change, rerun quickly, and build a tighter learning loop. The entire Session page is arranged around this cycle.',
      },
      {
        question: 'What happens after I run code?',
        answer:
          'Pebble surfaces testcase results, expected vs actual output, runtime state, and failure summaries. That context then feeds the coach panel and the submissions/solutions views, so the run is not an isolated event. It becomes the input to the next recovery step.',
      },
    ],
  },
  {
    id: 'flow',
    label: 'Practice flow',
    title: 'How the product surfaces connect',
    description: 'The main workflow across Problems, Session, Insights, and export.',
    icon: Workflow,
    items: [
      {
        question: 'How do Problems, Session, Insights, and Community connect?',
        answer:
          'Problems is the discovery layer, Session is the active coding workspace, Insights turns attempts into momentum and recovery signals, and Community shows how one difficult problem or AI hint can evolve into peer learning. The pages are separate, but the product story is one continuous loop.',
      },
      {
        question: 'How do submissions, solutions, and reports fit in?',
        answer:
          'Session includes solutions and submissions views so the user can compare approaches and inspect acceptance history without leaving the workspace. The product also supports a downloadable recovery report so the session can end with something concrete and demo-visible.',
      },
      {
        question: 'Can PebbleCode support interview prep, DSA, SQL, and project-style learning?',
        answer:
          'Yes, within the scope already visible in the repo. The product includes DSA-style problems, SQL-oriented problem support, interview-prep framing in community and placement content, and seeded project-collaboration community spaces. The prototype is broad in surface area even where some content is still curated and seeded.',
      },
      {
        question: 'What does the Weekly Pebble Recap or Insights area actually do?',
        answer:
          'Insights derives streaks, recovery time, guidance reliance, issue patterns, and recent activity from structured analytics events. The weekly recap turns the last seven days into a mentor-style summary and can optionally use audio playback when the relevant configuration is available.',
      },
    ],
  },
  {
    id: 'scope',
    label: 'Prototype scope',
    title: 'What is implemented now versus seeded or future-facing',
    description: 'Clear prototype boundaries without underselling the product.',
    icon: FileText,
    items: [
      {
        question: 'Is the Community page real or seeded for demo purposes?',
        answer:
          'It is a frontend-first seeded prototype. The page, thread routing, local reply behavior, and discussion-room interaction are implemented, but the activity is demo-seeded rather than coming from live backend users. It exists to show how Pebble can extend from solo recovery into peer learning.',
      },
      {
        question: 'What does multilingual support actually mean here?',
        answer:
          'The prototype already includes multilingual UI and localized problem/solution content paths across English and several Indian languages. It also includes language-aware mentor and recap behavior where those features are wired. This is about interface and guidance accessibility, not changing the programming language runtime itself.',
      },
      {
        question: 'Is PebbleCode a complete platform yet?',
        answer:
          'No. It is a serious, working prototype with substantial frontend depth, local-first persistence, auth flows, runner logic, and AWS deployment paths. Some richer cloud-backed analytics, structured agent behavior, and full backend parity still depend on configuration or future implementation.',
      },
      {
        question: 'What is planned next beyond the current prototype?',
        answer:
          'The codebase already points toward stronger peer-learning workflows, deeper analytics parity between local and deployed backends, richer mentor orchestration, broader content coverage, and more complete community-powered collaboration features. The current build is the product argument, not the final ceiling.',
      },
    ],
  },
]

export const HOW_TO_USE_STEPS: HelpStep[] = [
  {
    id: 'start-home',
    label: 'Step 1',
    title: 'Start from the landing page and understand the product loop',
    body:
      'The homepage is not just marketing copy. It already previews the core Pebble experience: runtime-aware coding, mentor guidance, daily planning, and a strong product narrative around recovery rather than brute-force acceptance.',
    detail:
      'If you are demoing, this is where you set the frame: PebbleCode is a coding practice product that turns failed runs into guided next steps.',
    icon: Sparkles,
    chips: ['Landing', 'Daily plan', 'Product preview'],
  },
  {
    id: 'onboarding-placement',
    label: 'Step 2',
    title: 'Set level and language, then use placement to calibrate the path',
    body:
      'Onboarding captures current level and language focus, while Placement mixes MCQ and coding questions to suggest where a learner should begin. The editor language remains flexible later, but the learning track helps shape the starting path.',
    detail:
      'This is a useful judge moment because it shows Pebble is not only a single-problem sandbox; it is trying to personalize the starting experience.',
    icon: Brain,
    chips: ['Onboarding', 'Placement', 'Learning track'],
  },
  {
    id: 'browse-problems',
    label: 'Step 3',
    title: 'Use Problems to discover the right problem quickly',
    body:
      'The Problems page supports search, topic filtering, solved tracking, sorting, and previewing before entering a session. It behaves like a curated browser rather than a flat spreadsheet of challenges.',
    detail:
      'In a fast demo, pick one problem that can fail early so the mentor and recovery loop become obvious inside Session.',
    icon: Compass,
    chips: ['Problems browser', 'Topic filters', 'Solved state'],
  },
  {
    id: 'session-run',
    label: 'Step 4',
    title: 'Open Session and treat Run as the beginning of learning, not the end',
    body:
      'Session is the core workspace. Read the problem, write code, switch editor language if needed, and run the current attempt. The center of gravity is the editor plus testcase feedback, with the mentor rail always available on the side.',
    detail:
      'Pebble is strongest when the first run is imperfect. That is when the product’s value becomes most visible.',
    icon: BookOpen,
    chips: ['Session IDE', 'Run / submit', 'Testcases'],
  },
  {
    id: 'coach-recovery',
    label: 'Step 5',
    title: 'Use Pebble Coach to interpret the failure and recover deliberately',
    body:
      'The coach rail is designed around tiered help such as hint, explain, and next step. It uses the current problem, code, run output, and failure state so the response stays tied to what just happened instead of becoming a generic chat answer.',
    detail:
      'This is the clearest product-differentiation moment in the app: the user does not need to leave the coding surface to get grounded help.',
    icon: Bot,
    chips: ['Hint', 'Explain', 'Next step'],
  },
  {
    id: 'review-submit',
    label: 'Step 6',
    title: 'Submit, inspect submissions, and compare with the solution surface',
    body:
      'After improving the code, submit it. Then use the solutions and submissions tabs to review the accepted path, compare implementation language, inspect previous attempts, and understand what changed between runs.',
    detail:
      'If you want a memorable demo finish, export the recovery report from Session after showing a recovered attempt.',
    icon: Lightbulb,
    chips: ['Solutions', 'Submissions', 'Recovery report'],
  },
  {
    id: 'insights-recap',
    label: 'Step 7',
    title: 'Open Insights to show what Pebble measures beyond accepted answers',
    body:
      'Insights turns attempts into user-facing metrics such as streaks, recovery time, guidance reliance, issue patterns, and a weekly recap. This is where Pebble argues that learning quality can be measured, not just final correctness.',
    detail:
      'Some analytics are fully local-first in the prototype, while richer cohort/cloud paths exist only when the relevant backend routes are configured.',
    icon: Globe,
    chips: ['Streaks', 'Recovery metrics', 'Weekly recap'],
  },
  {
    id: 'community-layer',
    label: 'Step 8',
    title: 'Use Community to show how solo recovery can become peer learning',
    body:
      'The Community experience is seeded but intentionally product-facing. It demonstrates how failed runs, AI hint confusion, interview questions, and collaboration needs can become discussion threads, group rooms, and a broader learning ecosystem around Pebble.',
    detail:
      'For judges, the key message is not “we built a forum.” It is “Pebble can grow from a coding mentor into a peer-learning platform.”',
    icon: MessageSquareText,
    chips: ['Seeded community', 'Thread room', 'Peer learning'],
  },
]

export const HOW_TO_USE_QUICK_PATH: HelpQuickPathStep[] = [
  {
    title: '1. Home → Try Pebble',
    detail: 'Set the product narrative before touching the IDE.',
  },
  {
    title: '2. Onboarding + Placement',
    detail: 'Show that Pebble adapts the starting path, not just the UI theme.',
  },
  {
    title: '3. Problems → open one challenge',
    detail: 'Pick a problem that can fail quickly so the recovery loop is visible.',
  },
  {
    title: '4. Session → Run → Coach → rerun',
    detail: 'This is the core wow moment of the product.',
  },
  {
    title: '5. Insights → Community',
    detail: 'Close by showing that the product measures learning and can extend into peer support.',
  },
]

export const HOW_TO_USE_NOTES = [
  'The Session, Problems, auth, and local-first Insights flows are real interactive surfaces in the prototype.',
  'Community is intentionally seeded to demonstrate believable product direction without claiming live user activity.',
  'Some cloud-backed analytics, recap playback paths, and richer mentor routes depend on environment configuration or local-dev backend parity.',
]

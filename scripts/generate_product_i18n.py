from __future__ import annotations
import json
from pathlib import Path
from typing import Any
import requests

LANGS = ['en','hi','bn','te','mr','ta','ur','gu','kn','ml','or','pa','as']
TRANSLATE_LANGS = [l for l in LANGS if l != 'en']
TRANSLATOR_CODES = {
    'hi': 'hi',
    'bn': 'bn',
    'te': 'te',
    'mr': 'mr',
    'ta': 'ta',
    'ur': 'ur',
    'gu': 'gu',
    'kn': 'kn',
    'ml': 'ml',
    'or': 'or',
    'pa': 'pa',
    'as': 'as',
}
SKIP_KEYS = {'id','icon','initials','author','groupId','linkedProblem','to','variant','href'}
SKIP_PATH_SEGMENTS = {'tags'}
PROTECTED = [
    'PebbleCode','Pebble','AWS','Bedrock','Lambda','Two Sum','Python','JavaScript','Java','C++','C',
    'SQL','DSA','API','UI','React','Tailwind','Vite','Monaco','Cognito','DynamoDB','S3','CloudFront','Amplify',
    'Session','Problems','Insights','Community','Home','FAQ','About','How to Use'
]

SOURCE: dict[str, Any] = {
  'footer': {
    'description': 'Elite coding practice with mentor-level guidance.',
    'builtWith': 'Built with',
    'product': 'Product',
    'guides': 'Guides',
    'account': 'Account',
    'legal': 'Legal',
    'copyright': '© 2026 Pebble. All rights reserved.',
  },
  'home': {
    'continue': {
      'resumeDescription': 'Resume the thread, rerun the last failing case, and close the loop while context is still warm.',
      'emptyDescription': 'Pick a first problem and Pebble will keep your runtime context ready to continue next time.',
      'emptyChips': ['Guided warm-up', 'Real runtime checks', 'Coach in context'],
      'resumeRail': 'Jump straight back into the same unit and keep your recovery loop short.',
      'emptyRail': 'Start a first session and Pebble will build your continuation context automatically.',
    },
    'todayPlan': {
      'dailyLoop': 'Daily loop',
      'focusChip': '25 min focus',
      'focusLoad': 'Focus load',
      'stateNeutral': 'Neutral',
      'stateBalanced': 'Balanced',
      'stateStretch': 'Stretch',
      'stateHeavy': 'Heavy',
      'emptyTitle': 'Generate a focused set of small wins from your recent momentum.',
      'emptyBody': 'Pebble will shape one warm-up, one recovery task, and one review step so the session starts with clear intent.',
      'sessionPacing': 'Session pacing',
      'sessionPacingBody': 'Three deliberate tasks tuned for consistency over thrash.',
      'expectedLabel': 'Expected by end of session',
      'outcomes': {
        'backInRhythm': 'Today should leave you back in rhythm with one clean win and a clearer next step.',
        'reviewAndWin': 'By the end of this session, you should have one clean win, one reviewed mistake, and better recovery flow.',
        'heavy': 'A short focused session should rebuild momentum without letting the workload sprawl.',
        'drill': 'You should finish with one solved rep, one review insight, and a cleaner recovery loop.',
        'light': 'This session should help you leave with momentum restored, not mentally drained.',
        'default': 'You should finish today with steady momentum, one completed focus loop, and stronger confidence for the next session.',
      },
      'closeDialog': 'Close dialog',
    },
    'recommended': {
      'emptyDescription': 'Open the browser to pick a fresh concept or revisit a topic you want to sharpen next.',
      'bestNextMove': 'Best next move',
      'whyPicked': 'Why Pebble picked this',
      'reasonMomentum': 'Keeps your {topic} momentum going from the last session.',
      'reasonBalanced': 'Balanced next step to keep your practice streak moving without spiking difficulty.',
      'cueWarmup': 'Low-friction warm-up',
      'cueMomentum': 'Momentum-building challenge',
      'cueStretch': 'Stretch rep for confidence',
      'close': 'Close',
    },
    'featureGrid': {
      'sectionPill': 'Product capabilities',
      'sectionTitle': 'Pebble is designed around the full practice loop, not just the final answer.',
      'sectionBody': 'Run real code, recover faster with grounded help, keep guidance multilingual, and choose the next rep with more intent.',
      'capabilityChips': ['Runtime feedback', 'Coach in context', 'Multilingual guidance', 'Curated browser'],
      'tiles': [
        {
          'id': 'runtime',
          'title': 'Run code with real feedback',
          'detail': 'Run against examples and hidden checks, isolate the failing case fast, and rerun with cleaner intent.',
          'tag': 'Runtime',
          'runtime': {
            'failBadge': 'Fail #2',
            'expected': 'Expected',
            'actual': 'Actual',
            'signal': 'Pebble isolates the fail case first, then points you to the exact recovery move.',
            'caseIsolated': 'Case isolated',
            'nextInspect': 'Next: inspect complement logic',
          },
        },
        {
          'id': 'coach',
          'title': 'Pebble Coach',
          'detail': 'Hint, Explain, and next-step guidance stay anchored to your current code, latest run output, and recovery state.',
          'tag': 'Coach',
          'coach': {
            'chips': ['Hint', 'Explain', 'Next step'],
            'bubble1': 'Your run failed on case #2. Check the complement before you store the current value.',
            'bubble2': 'One next step: test whether target - nums[i] already exists in seen first.',
            'tiered': 'Tiered guidance',
            'grounded': 'Grounded in latest run',
          },
        },
        {
          'id': 'languages',
          'title': 'Multilingual mentor',
          'detail': 'Switch guidance across English and Indian languages without losing technical precision or the coding context.',
          'tag': 'Language',
          'languages': {
            'language': 'Language',
            'hintEn': 'Hint: keep the map updated before checking the next index.',
            'sameLogic': 'Same logic, local language',
            'sync': 'Mentor stays in sync',
          },
        },
        {
          'id': 'browser',
          'title': 'LeetCode-style problems browser',
          'detail': 'Browse by topic, difficulty, and readiness so the next rep feels selected, not random.',
          'tag': 'Browser',
          'browser': {
            'search': 'Search problems, topics, tags',
            'picked': 'Picked for Array momentum',
            'minutes': '12 min rep',
            'rec': 'Rec',
          },
        },
      ],
    },
  },
  'insights': {
    'streakRisk': {
      'title': 'Streak Risk',
      'subtitleLocal': '7-day forecast',
      'subtitleCloud': 'SageMaker · 7-day forecast',
      'recompute': 'Recompute',
      'recomputeTitle': 'Recompute risk score',
      'computing': 'Computing…',
      'computingBody': 'Computing risk score…',
      'low': 'Low Risk',
      'medium': 'Medium Risk',
      'high': 'High Risk',
      'sagemaker': 'SageMaker model',
      'local': 'Local model',
      'actions': 'Recommended actions',
      'empty': 'No risk data yet — click Recompute to generate.',
    },
    'weeklyRecap': {
      'title': 'Weekly Pebble Recap',
      'subtitle': 'A mentor-style summary of your last 7 days',
      'metaLast7': 'Last 7 days',
      'metaMentor': 'Mentor summary',
      'metaAudio': 'Audio ready',
      'metaScript': 'Script ready',
      'loading': 'Loading recap…',
      'emptyTitle': 'No recap generated yet for this week.',
      'emptyBody': 'Generate a mentor summary to hear how your practice, recovery, and momentum evolved.',
      'readyTitle': 'This week’s recap is ready.',
      'readyBody': 'Press play to hear Pebble summarize your progress, setbacks, and recovery pattern.',
      'generate': 'Generate recap',
      'regenerate': 'Regenerate',
      'generating': 'Generating…',
      'play': 'Play recap',
      'stop': 'Stop',
      'showScript': 'Show script',
      'hideScript': 'Hide script',
      'transcript': 'Transcript',
      'playbackReady': 'Playback ready',
      'scriptReady': 'Script ready',
      'cloudUnavailable': 'Cloud audio was unavailable, but the recap script is ready.',
      'audioUnavailable': 'Audio voice unavailable right now — script is ready.',
      'bestVoice': 'Playing with the best available voice for this language.',
      'friendlyEmpty': 'Generate a mentor-style summary to hear how your practice, recovery, and momentum evolved this week.',
    },
  },
  'session': {
    'hintTones': [
      {'label': 'Pebble Tip', 'prefix': 'Tiny nudge: '},
      {'label': 'Quick Nudge', 'prefix': 'Quick sanity check: '},
      {'label': 'Tiny Step', 'prefix': 'Small win: '},
      {'label': 'Coach Cue', 'prefix': 'Try this: '},
    ],
  },
  'community': {
    'ui': {
      'heroBadge': 'Peer learning layer',
      'heroSeeded': 'Seeded demo discussions',
      'heroTitle': 'Learn with peers, not just prompts.',
      'heroBody': 'PebbleCode can turn failed runs, interview doubts, and project questions into collaborative learning threads without breaking the focused coding workflow.',
      'askCommunity': 'Ask community',
      'browseDiscussions': 'Browse discussions',
      'heroChips': ['Debugging help', 'Project partners', 'Interview prep', 'SQL + DSA groups'],
      'viewLabel': 'Community view',
      'groupShortcuts': 'Group shortcuts',
      'clear': 'Clear',
      'createFromProblem': 'Create from current problem',
      'createFromProblemBody': 'Turn a failed run into a forum thread with the problem, language, and testcase context already filled in.',
      'askFromProblem': 'Ask from current problem',
      'forumPill': 'Forum surface',
      'activeDiscussions': 'Active discussions',
      'forumBody': 'Pebble’s strongest community story is here: real threads about failed testcases, interview framing, collaborator search, and AI-hint clarification.',
      'threads': 'threads',
      'topHelpers': 'Top helpers this week',
      'topHelpersBody': 'A compact proof that the community layer can surface useful peer guidance, not just extra noise.',
      'whyMatters': 'Why this matters',
      'whyMattersBody': 'Pebble is stronger when AI guidance and peer discussion reinforce each other after a confusing run.',
      'comingNext': 'Coming next',
      'comingNextItems': ['Mentor drop-ins for difficult threads', 'Student-created problem rooms', 'Direct share from Session into Community'],
      'openThread': 'Open thread',
      'trending': 'Trending',
      'solved': 'Solved',
      'replies': 'replies',
      'helpful': 'helpful',
      'threadBack': 'Back to community',
      'discussion': 'Discussion',
      'solvedThread': 'Solved thread',
      'trendingNow': 'Trending now',
      'threadDescription': 'A collaborative study-room view for one coding discussion: what the learner asked, how peers responded, and how Pebble could turn stuck moments into shared recovery.',
      'roomNow': 'Room now',
      'participants': 'participants',
      'discussionRoom': 'Discussion room',
      'discussionRoomTitle': 'Peer replies around one coding issue',
      'markedSolved': 'Marked solved',
      'originalQuestion': 'Original question',
      'fromProblem': 'From problem',
      'peerReply': 'Peer reply',
      'helpfulChip': 'Helpful',
      'replyDiscussion': 'Reply to the discussion',
      'replyDiscussionBody': 'Share what Pebble suggested, ask for clarification, or help someone debug the current issue.',
      'replyPlaceholder': 'Reply to the discussion…',
      'attach': 'Attach',
      'attachHint': 'Attachment flow is staged for the backend phase of the prototype.',
      'localReplyNote': 'Local replies append instantly for demo flow.',
      'send': 'Send',
      'roomContext': 'Room context',
      'roomContextTitle': 'Why this thread matters in Pebble',
      'roomContextBody': 'This room shows the collaborative layer Pebble needs: a learner hits friction, AI narrows the gap, and peers help translate the final confusion into understanding.',
      'workflowSignal': 'Workflow signal',
      'workflowLine': 'Failed run → Pebble hint → community discussion → cleaner retry.',
      'keepExploring': 'Keep exploring',
      'composer': {
        'title': 'Turn a stuck moment into a discussion.',
        'body': 'Ask for debugging help, share an insight, or start a collaboration thread that connects Pebble sessions with real peer learning.',
        'close': 'Close composer',
        'quickDebug': 'Ask for debugging help',
        'quickInsight': 'Share insight',
        'quickPartners': 'Find project partners',
        'titleLabel': 'Title',
        'titlePlaceholder': 'What are you stuck on?',
        'bodyLabel': 'Body',
        'bodyPlaceholder': 'Share the failing case, the logic you tried, or the kind of review you want from peers.',
        'tagsLabel': 'Tags',
        'tagsPlaceholder': 'Array, Hash Map, Python',
        'linkedLabel': 'Linked problem',
        'linkedPlaceholder': 'Two Sum',
        'groupLabel': 'Group',
        'prefillLabel': 'Create from current problem',
        'prefillBody': 'Problem: Two Sum\nLanguage: Python\nIssue: Fails on test case #2',
        'prefillAction': 'Prefill from session',
        'postingNoteLabel': 'Posting note',
        'postingNoteBody': 'This prototype appends locally for demo purposes. It is structured to map cleanly to future community APIs.',
        'ready': 'Ready to post into the seeded community feed.',
        'needsMore': 'Add a clearer title and a little more context.',
        'cancel': 'Cancel',
        'post': 'Post',
      },
    },
    'groups': [
      {'id':'debugging-help','name':'Debugging Help','description':'Turn failed runs into clear next steps with peer debugging eyes.','icon':'bug','membersLabel':'2.4k learners','lastActivity':'Active 8m ago','tags':['Fail cases','Edge cases','Runtime'],'featured':True},
      {'id':'python-help','name':'Python Help','description':'Python syntax, patterns, interview-style review, and cleanup.','icon':'code','membersLabel':'1.9k learners','lastActivity':'Active 14m ago','tags':['Python','Hash Map','Loops']},
      {'id':'sql-help','name':'SQL Help','description':'Queries, joins, subqueries, and interview-style database thinking.','icon':'database','membersLabel':'1.3k learners','lastActivity':'Active 21m ago','tags':['JOIN','CTE','Practice']},
      {'id':'interview-prep','name':'Interview Prep','description':'Mock prompts, explanation drills, and placement strategy threads.','icon':'briefcase','membersLabel':'3.1k learners','lastActivity':'Active 6m ago','tags':['Placements','Complexity','Mocks']},
      {'id':'project-partners','name':'Project Partners','description':'Find teammates for student builds, demos, and hackathon sprint work.','icon':'users','membersLabel':'860 builders','lastActivity':'Active 39m ago','tags':['Hackathon','Collab','MVP']},
      {'id':'dsa-strategy','name':'DSA Strategy','description':'Pattern selection, sequencing, and how to recover after a wrong turn.','icon':'blocks','membersLabel':'2.8k learners','lastActivity':'Active 11m ago','tags':['Arrays','DP','Graph']},
    ],
    'posts': [
      {
        'id':'post-two-sum-duplicates','groupId':'debugging-help','title':'Why does my Two Sum fail when the same value appears twice?','author':'Aarav','initials':'AA','timestamp':'15m ago','body':'Pebble flagged test case #2 and hinted at complement order, but I still keep missing the duplicate case. Can someone explain why storing first breaks it?','replyCount':14,'helpfulCount':23,'solved':True,'trending':True,'tags':['Array','Hash Map','Python'],'linkedProblem':'Two Sum',
        'previewReplies':[
          {'id':'reply-two-sum-1','author':'Meera','initials':'ME','role':'Helpful reply','body':'Check whether target minus current already exists before storing the current value. That prevents the element from matching itself.','helpful':True,'timestamp':'11m ago'},
          {'id':'reply-two-sum-2','author':'Rohan','initials':'RO','body':'Think of the map as memory of previous values only. The current index should never be available to itself.','timestamp':'9m ago'}
        ]
      },
      {
        'id':'post-sql-join','groupId':'sql-help','title':'How do you explain LEFT JOIN vs INNER JOIN in a real interview answer?','author':'Kavya','initials':'KA','timestamp':'28m ago','body':'I can write the query, but my explanation sounds mechanical. I want a sharper, business-friendly explanation.','replyCount':9,'helpfulCount':17,'solved':False,'tags':['SQL','JOIN','Interview'],'linkedProblem':'Customer Orders Join',
        'previewReplies':[
          {'id':'reply-sql-1','author':'Isha','initials':'IS','body':'Anchor your answer around missing matches. INNER JOIN keeps overlap only; LEFT JOIN preserves the left table even without a match.','helpful':True,'timestamp':'19m ago'},
          {'id':'reply-sql-2','author':'Rahul','initials':'RA','body':'Use a business frame like “show every customer, even if they never ordered.” It lands well in interviews.','timestamp':'17m ago'}
        ]
      },
      {
        'id':'post-recursion-review','groupId':'interview-prep','title':'Can someone review how I explain recursion without sounding lost?','author':'Aditya','initials':'AD','timestamp':'43m ago','body':'I understand the idea, but in mock interviews my explanation gets messy. Looking for a concise structure.','replyCount':11,'helpfulCount':15,'solved':False,'tags':['Recursion','Interview','Communication'],
        'previewReplies':[
          {'id':'reply-rec-1','author':'Tanvi','initials':'TA','body':'Use three parts: what shrinks, where it stops, and what returns back up.','helpful':True,'timestamp':'33m ago'},
          {'id':'reply-rec-2','author':'Priyanshu','initials':'PR','body':'Start with the repeated subproblem first. Mention the call stack only if they ask.','timestamp':'29m ago'}
        ]
      },
      {
        'id':'post-hackathon-teammate','groupId':'project-partners','title':'Need one frontend teammate for an AI hackathon build this weekend','author':'Dev','initials':'DE','timestamp':'1h ago','body':'We have backend and product covered. Looking for someone comfortable with React and Tailwind for polish and demo prep.','replyCount':6,'helpfulCount':8,'solved':False,'tags':['Hackathon','React','Frontend'],
        'previewReplies':[
          {'id':'reply-team-1','author':'Harsh','initials':'HA','body':'What timezone and scope? I can help if the work is mostly polish and demo readiness.','timestamp':'52m ago'},
          {'id':'reply-team-2','author':'Kavya','initials':'KA','body':'If you still need help on Sunday, I can join for UX review and finishing touches.','helpful':True,'timestamp':'49m ago'}
        ]
      },
      {
        'id':'post-pebble-hint','groupId':'debugging-help','title':'Pebble gave me a hint, but I still do not get the hashmap logic','author':'Meera','initials':'ME','timestamp':'1h ago','body':'The hint sounds smart, but I still cannot translate it into code. How do you turn a hint into an actual step?','replyCount':18,'helpfulCount':31,'solved':True,'trending':True,'tags':['AI hints','Hash Map','Workflow'],
        'previewReplies':[
          {'id':'reply-hint-1','author':'Aarav','initials':'AA','role':'Helpful reply','body':'Rewrite the hint in plain words first. Ask what the current element needs and what you want to have seen already.','helpful':True,'timestamp':'54m ago'},
          {'id':'reply-hint-2','author':'Sneha','initials':'SN','body':'Ask Pebble to restate the hint against the failing testcase. That usually makes it concrete.','timestamp':'41m ago'}
        ]
      },
      {
        'id':'post-python-to-sql','groupId':'sql-help','title':'How should I start SQL if I already know Python?','author':'Isha','initials':'IS','timestamp':'3h ago','body':'I am comfortable with Python logic, but SQL feels like a different mental model. Looking for the most useful entry path.','replyCount':10,'helpfulCount':19,'solved':True,'tags':['SQL','Placements','Beginner'],
        'previewReplies':[
          {'id':'reply-sql-path-1','author':'Dev','initials':'DE','body':'Think in tables instead of loops. Start with select, filter, and grouping before joins.','helpful':True,'timestamp':'2h ago'},
          {'id':'reply-sql-path-2','author':'Kavya','initials':'KA','body':'Use interview-style datasets early so the syntax stays tied to real questions.','timestamp':'2h ago'}
        ]
      },
      {
        'id':'post-session-recovery','groupId':'debugging-help','title':'After three failed runs I stop thinking clearly. How do you reset?','author':'Sneha','initials':'SN','timestamp':'Yesterday','body':'I like the Pebble recovery loop, but after a few wrong answers I still spiral and start patching randomly. Looking for human strategies that work.','replyCount':16,'helpfulCount':29,'solved':True,'trending':True,'tags':['Recovery','Mindset','Debugging'],
        'previewReplies':[
          {'id':'reply-recovery-1','author':'Rahul','initials':'RA','role':'Helpful reply','body':'Force a two-minute reset. Write the failing case in words, state the invariant, then rerun only one change.','helpful':True,'timestamp':'Yesterday'},
          {'id':'reply-recovery-2','author':'Harsh','initials':'HA','body':'Do not stack fixes. Ask Pebble for one next check, then explain the case to yourself before touching code.','timestamp':'Yesterday'}
        ]
      },
      {
        'id':'post-hackathon-scope','groupId':'project-partners','title':'How do you decide what to cut from a hackathon MVP without weakening the story?','author':'Rohan','initials':'RO','timestamp':'2d ago','body':'We keep adding features, but the pitch is getting blurry. Curious how others decide what stays in the demo and what becomes future scope.','replyCount':13,'helpfulCount':24,'solved':True,'tags':['Hackathon','MVP','Product'],
        'previewReplies':[
          {'id':'reply-mvp-1','author':'Aditya','initials':'AD','body':'Keep only what proves the thesis. Everything else becomes future ecosystem potential in the narrative.','helpful':True,'timestamp':'2d ago'},
          {'id':'reply-mvp-2','author':'Sneha','initials':'SN','body':'If a feature needs too much explanation, it is probably not MVP for the demo.','timestamp':'2d ago'}
        ]
      },
    ],
    'trendingTopics':['Hash Map recovery','LEFT JOIN vs INNER JOIN','Hackathon teammate search','Recursion explanations','Placement resume bullets'],
    'topHelpers':[
      {'id':'helper-meera','name':'Meera','initials':'ME','specialty':'Debugging clarity','helpfulCount':38},
      {'id':'helper-rahul','name':'Rahul','initials':'RA','specialty':'Interview framing','helpfulCount':32},
      {'id':'helper-isha','name':'Isha','initials':'IS','specialty':'SQL and placement prep','helpfulCount':29},
    ],
    'filters':[
      {'id':'all','label':'All discussions'},
      {'id':'unanswered','label':'Unanswered'},
      {'id':'helpful','label':'Most helpful'},
      {'id':'trending','label':'Trending'},
      {'id':'problem','label':'Problem discussions'},
    ],
  },
  'help': {
    'about': {
      'badge': 'About PebbleCode',
      'note': 'Built from the live prototype',
      'title': 'A recovery-first coding mentor built for real student learning',
      'description': 'PebbleCode is a coding practice product designed around what happens after a learner gets stuck. The prototype combines a real coding workspace, grounded AI guidance, reflection surfaces, multilingual accessibility, and a seeded peer-learning layer.',
      'chips': ['Recovery-first learning','Multilingual guidance','Insights and recap','Community layer'],
      'whyTitle': 'Why PebbleCode exists',
      'whyHeadline': 'Most coding tools evaluate answers well, but they do not teach recovery well.',
      'whyBody1': 'Students are usually told whether a run passed or failed, but not given a structured way to recover, understand the failure, and build confidence from that moment.',
      'whyBody2': 'PebbleCode treats wrong runs, confusing hints, and repeated mistakes as first-class learning signals.',
      'whyCallout': 'Coding practice should help a learner diagnose, recover, reflect, and improve, not just chase an accepted badge.',
      'builtFor': 'Built for',
      'builtForTitle': 'Learners who need clarity, not just correctness',
      'builtForItems': ['Students practicing DSA, SQL, and interview reasoning','Placement-focused learners who need a guided start','Multilingual users who understand explanations better in a familiar language','Anyone who wants AI help, reflection, and peer learning in one flow'],
      'diffLabel': 'What makes it different',
      'diffs': [
        {'label':'Recovery loop','title':'Pebble treats failure as the main learning surface.','body':'Run → diagnose → coach → recover → rerun is the core product loop.'},
        {'label':'Grounded mentor','title':'Coach responses stay attached to the active coding context.','body':'Guidance uses the current problem, code, and latest run state instead of generic chat.'},
        {'label':'Reflection layer','title':'Insights turn attempts into measurable learning signals.','body':'The dashboard and weekly recap surface momentum, recovery time, and guidance reliance.'},
        {'label':'Peer layer','title':'Community extends solo recovery into collaborative learning.','body':'The seeded community shows how a stuck moment can become a shared learning thread.'},
      ],
      'flowLabel':'How the product works','flowTitle':'A practice loop built around recovery, not only acceptance','flowChip':'Home → Problems → Session → Insights → Community','flowSteps':['Start with intent from landing, onboarding, and placement.','Pick the right problem from a curated browser.','Run into something real inside Session.','Use Pebble Coach to recover deliberately.','Reflect in Insights and extend in Community.'],
      'multiLabel':'Multilingual vision','multiTitle':'Understanding improves when explanations meet the learner where they are.','multiBody1':'Many students write code in English syntax but understand reasoning better in a familiar language.',
      'multiBody2':'PebbleCode uses multilingual UI and guidance to lower the barrier to understanding without diluting technical rigor.',
      'multiCallout':'Multilingual support is a product differentiator because it expands who can recover confidently, not just who can read syntax.',
      'prototypeLabel':'What is included in the prototype','prototypeTitle':'The build is broad today, but honest about what is seeded and what depends on configuration.','prototypeAreas':[
        {'label':'Interactive now','title':'Core product loop is demoable today.','items':['Landing, onboarding, and placement','Problems browser and session IDE','Run, submit, solutions, and submissions','Pebble Coach, auth, profile, settings','Insights dashboard and recap surface']},
        {'label':'Seeded for storytelling','title':'Frontend-first surfaces that prove the broader vision.','items':['Community groups, posts, and replies use seeded demo data','Thread rooms support local reply behavior','Some showcase and recommendation content is curated for demo clarity']},
        {'label':'Configuration dependent','title':'Cloud-backed paths become stronger when AWS services are wired.','items':['Cognito auth and verification','S3 avatars and recap audio','API Gateway + Lambda backend routes','Optional Bedrock-backed mentor and recap paths']},
      ],
      'stackLabel':'How we built it','stackTitle':'The architecture is serious enough to show real depth while staying hackathon-practical.','stackItems':[
        {'label':'Frontend','title':'Vite + React + TypeScript + Tailwind','body':'A premium multi-surface app shell for Home, Problems, Session, Insights, Community, auth, profile, and help.'},
        {'label':'Execution','title':'Local runner plus serverless-compatible APIs','body':'Pebble supports real run and submit flows, testcase diagnostics, and report generation.'},
        {'label':'Identity and storage','title':'Cognito, DynamoDB, S3, and local-first persistence','body':'Profiles, usernames, avatars, solved state, and activity signals persist cleanly while degrading safely in prototype mode.'},
        {'label':'Cloud and AI','title':'AWS CDK path with optional Bedrock guidance','body':'The repo includes CloudFront or Amplify frontend hosting, API Gateway + Lambda services, and optional Bedrock-backed mentor orchestration.'},
      ],
      'impactLabel':'Why this matters','impactItems':['Students need more than accepted or rejected outputs.','Interview prep improves when explanation quality improves.','Peer learning grows stronger when AI and humans reinforce each other.','A recovery-first model can scale beyond one problem into long-term confidence.'],
      'closingLabel':'Closing note','closingTitle':'PebbleCode treats coding practice as a learning system, not just a problem list.','closingBody':'The prototype already proves a credible product argument: students need a workflow that helps them write, fail, recover, reflect, and eventually learn with others.','closingCtas':['See the full product walkthrough','Read judge-facing product answers','Open the core Session experience'],
    },
    'faq': {
      'badge': 'FAQ',
      'note': 'Judge-friendly product context',
      'title': 'Fast answers about what PebbleCode actually does',
      'description': 'This page explains the real product shape of PebbleCode as it exists in the repo today: what is interactive, what is seeded for demo value, and why the product is organized around recovery instead of raw acceptance alone.',
      'chips': ['Recovery-first practice','Grounded mentor help','Seeded community layer','Prototype with real flows'],
      'groups': [
        {'id':'product','label':'Product','title':'What PebbleCode is solving','description':'The first questions judges and new users ask.','icon':'Sparkles','items':[
          {'question':'What is PebbleCode?','answer':'PebbleCode is a recovery-first coding practice workspace. It is built around opening a problem, running code, understanding failure, getting grounded help, fixing it, and measuring improvement over time.'},
          {'question':'How is it different from a normal coding platform?','answer':'It combines a premium session workspace, testcase-level feedback, guided mentor help, reflection surfaces, and a seeded peer-learning layer in one flow.'},
          {'question':'What should a judge notice first in a demo?','answer':'The strongest sequence is: open a problem, fail a run, use Pebble Coach, rerun, then show how Insights and Community extend the same learning loop.'},
        ]},
        {'id':'mentor','label':'AI mentor','title':'How the coach behaves','description':'Grounded help, not generic chatbot behavior.','icon':'Bot','items':[
          {'question':'Does Pebble give full solutions immediately?','answer':'Not by default. The mentor is designed around hint, explain, and next-step guidance so learners recover deliberately before seeing a full answer.'},
          {'question':'What happens after I run code?','answer':'Pebble shows testcase results, expected versus actual output, and a failure summary. That context feeds the coach rail and the next recovery step.'},
          {'question':'How does the recovery loop work?','answer':'Run or submit, inspect failure, use grounded help, make one focused change, rerun, then reflect on the pattern in Insights.'},
        ]},
        {'id':'scope','label':'Prototype scope','title':'What is implemented now','description':'Clear boundaries without underselling the product.','icon':'FileText','items':[
          {'question':'Is the Community page real or seeded?','answer':'It is a frontend-first seeded prototype. The interactions and thread routes are real, but the activity is intentionally seeded for demo clarity.'},
          {'question':'What does multilingual support mean here?','answer':'The prototype includes multilingual UI and localized content paths across English and several Indian languages, plus language-aware guidance where wired.'},
          {'question':'Is PebbleCode complete?','answer':'No. It is a serious working prototype with real flows, runner logic, auth, and AWS deployment paths, but some richer cloud features still depend on configuration.'},
        ]},
      ],
      'bestSignal':'Best demo signal',
      'bestSignalTitle':'What judges should notice first',
      'bestSignalItems':['Pebble is strongest when a user fails a run, opens Coach, applies the explanation, and reruns.','Community is intentionally seeded, but it proves the product can evolve from solo AI guidance into collaborative learning.'],
      'prototypeNote':'Prototype note',
      'prototypeNoteTitle':'What is real today',
      'prototypeNoteItems':['Problems, Session, Coach, auth flows, placement, notifications, settings, and local-first insights are real interactive surfaces.','Weekly recap and cloud-backed analytics exist, but some deeper backend paths depend on environment configuration.','Community uses seeded content by design so the product direction is visible without claiming live user traffic.'],
      'backToHome':'Back to home',
      'backBody':'If you want the full product story first, open About PebbleCode. If you want the guided walkthrough, open How to Use.',
    },
    'howTo': {
      'badge':'How to Use','note':'Built from current app flow','title':'The fastest way to understand PebbleCode end to end','description':'This is a product tour of the app as it exists now. Follow it if you are evaluating PebbleCode for the first time, or if you want the shortest path from landing page to the core recovery-loop demo.','chips':['Home','Problems','Session','Insights','Community'],
      'quickTour':'Judge quick tour','quickTourTitle':'Best demo flow in under 3 minutes','quickTourChip':'High signal','quickPath':[
        {'title':'1. Home → Try Pebble','detail':'Set the product narrative before touching the IDE.'},
        {'title':'2. Onboarding + Placement','detail':'Show that Pebble personalizes the starting path instead of dropping users into a random problem.'},
        {'title':'3. Problems → open one challenge','detail':'Pick a problem that can fail early so the recovery loop becomes visible.'},
        {'title':'4. Session → run → coach → rerun','detail':'This is the core product moment: failure becomes grounded help and a cleaner next attempt.'},
      ],
      'steps':[
        {'id':'home','label':'Step 1','title':'Start from the landing page','body':'Use the homepage to frame Pebble as a coding practice product built around runtime feedback, mentor help, and reflection.','detail':'This is where you set the thesis: Pebble turns failed runs into guided next steps.','chips':['Landing','Daily plan','Product preview'],'icon':'Sparkles'},
        {'id':'placement','label':'Step 2','title':'Set level and language, then use placement','body':'Onboarding captures level and language focus, while placement suggests a sensible starting path.','detail':'This shows Pebble is trying to personalize learning, not just host questions.','chips':['Onboarding','Placement','Track'],'icon':'Brain'},
        {'id':'problems','label':'Step 3','title':'Use Problems to pick the right challenge','body':'The Problems page supports search, topic filtering, solved tracking, and preview before entering a session.','detail':'In a demo, pick one problem that can fail clearly so the mentor has useful context.','chips':['Browser','Filters','Preview'],'icon':'Compass'},
        {'id':'session','label':'Step 4','title':'Open Session and run imperfect code first','body':'Session is the core workspace. The editor, testcases, and mentor rail are arranged around quick recovery after a wrong run.','detail':'Pebble is strongest when the first attempt is not perfect.','chips':['IDE','Run','Testcases'],'icon':'BookOpen'},
        {'id':'coach','label':'Step 5','title':'Use Pebble Coach to recover deliberately','body':'Hint, explain, and next-step guidance stay attached to the current problem, code, and run output.','detail':'This is the clearest product differentiation moment in the app.','chips':['Hint','Explain','Next step'],'icon':'Bot'},
        {'id':'insights','label':'Step 6','title':'Finish on Insights or Community','body':'Insights shows recovery patterns and momentum, while Community shows how solo struggle can become peer learning.','detail':'This gives the demo breadth beyond one accepted answer.','chips':['Insights','Recap','Community'],'icon':'Globe'},
      ],
      'suggestedRun':'Suggested first run','suggestedRunTitle':'The cleanest live demo sequence','suggestedRunItems':['Open Two Sum or another problem with a visible fail case.','Run an imperfect solution first so Pebble Coach has something concrete to react to.','Use hint → explain → next step, then rerun.','Finish on Insights or Community so the demo ends with product breadth.'],
      'prototypeNotes':'Prototype notes','prototypeNotesTitle':'What is interactive vs seeded','prototypeNotesItems':['Core practice surfaces are interactive and local-first.','Some deeper cloud-backed paths depend on backend configuration.','Community activity is seeded intentionally for demo storytelling.'],
      'backToHome':'Back to home','backBody':'If you want the judge-facing narrative first, open About PebbleCode. If you need sharper question-and-answer framing, open FAQ.',
    },
  },
}

PROTECT_MAP = {term: f'__P{idx}__' for idx, term in enumerate(PROTECTED)}
REVERSE_PROTECT = {v: k for k, v in PROTECT_MAP.items()}


def protect(text: str):
    for k, v in PROTECT_MAP.items():
        text = text.replace(k, v)
    return text


def unprotect(text: str):
    for k, v in REVERSE_PROTECT.items():
        text = text.replace(k, v)
    return text


def should_skip(path: list[str], key: str | None = None):
    if key and key in SKIP_KEYS:
        return True
    if any(seg in SKIP_PATH_SEGMENTS for seg in path):
        return True
    return False

translator_cache = {}

def translate_text(text: str, lang: str):
    if lang == 'en' or not text.strip():
        return text
    cache_key = (lang, text)
    if cache_key in translator_cache:
        return translator_cache[cache_key]
    protected = protect(text)
    translated = translate_batch([protected], lang)[0]
    translated = unprotect(translated)
    translator_cache[cache_key] = translated
    return translated


def collect_strings(value: Any, path: list[str], out: set[str]) -> None:
    if isinstance(value, dict):
        for k, v in value.items():
            if should_skip(path, k):
                continue
            collect_strings(v, path + [k], out)
        return
    if isinstance(value, list):
        if should_skip(path):
            return
        for item in value:
            collect_strings(item, path + ['[]'], out)
        return
    if isinstance(value, str):
        if should_skip(path):
            return
        if value.strip():
            out.add(value)


def build_translation_map(source: Any, lang: str) -> dict[str, str]:
    strings: set[str] = set()
    collect_strings(source, [], strings)
    if not strings:
        return {}
    ordered = sorted(strings)
    translated_batch: list[str] = []
    chunk_size = 20
    for start in range(0, len(ordered), chunk_size):
        batch = ordered[start:start + chunk_size]
        print(f'  {lang}: {start + 1}-{min(start + len(batch), len(ordered))}/{len(ordered)}', flush=True)
        protected_batch = [protect(text) for text in batch]
        translated_batch.extend(translate_batch(protected_batch, lang))
    return {
        original: unprotect(result) if isinstance(result, str) and result else original
        for original, result in zip(ordered, translated_batch, strict=True)
    }


def translate_batch(batch: list[str], lang: str) -> list[str]:
    separator = ' |||__PEBBLE_SPLIT__||| '
    joined = separator.join(batch)
    response = requests.get(
        'https://translate.googleapis.com/translate_a/single',
        params={
            'client': 'gtx',
            'sl': 'en',
            'tl': TRANSLATOR_CODES[lang],
            'dt': 't',
            'q': joined,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    translated = ''.join(part[0] for part in payload[0])
    parts = translated.split(separator)
    if len(parts) != len(batch):
        return batch
    return parts


def walk(value: Any, lang: str, path: list[str]) -> Any:
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if should_skip(path, k):
                out[k] = v
            else:
                out[k] = walk(v, lang, path + [k])
        return out
    if isinstance(value, list):
        if should_skip(path):
            return value
        return [walk(v, lang, path + ['[]']) for v in value]
    if isinstance(value, str):
        if should_skip(path):
            return value
        return translate_text(value, lang)
    return value

all_content = {'en': SOURCE}
for lang in TRANSLATE_LANGS:
    print('translating', lang, flush=True)
    for original, translated in build_translation_map(SOURCE, lang).items():
        translator_cache[(lang, original)] = translated
    all_content[lang] = walk(SOURCE, lang, [])

out = '/* Auto-generated by scripts/generate_product_i18n.py */\n' + 'import type { LanguageCode } from \'./languages\'\n\n' + 'export const PRODUCT_GENERATED: Partial<Record<LanguageCode, any>> = ' + json.dumps(all_content, ensure_ascii=False, indent=2) + ' as const\n'
Path('src/i18n/productGenerated.ts').write_text(out, encoding='utf-8')
print('wrote src/i18n/productGenerated.ts')

# Archive

This folder stores legacy/prototype files moved out of runtime build paths during cleanup.

## Why archived instead of deleted

These files had no active imports/routes/references in `src` at cleanup time, but may still contain useful ideas for near-term experimentation.

## Archived on 2026-03-06

- `src/pages/AuthPage.tsx`
  - Replaced by route-based auth pages in `src/pages/auth/*`.
- `src/components/home/JourneyCard.tsx`
- `src/components/home/NextUpCard.tsx`
  - Superseded by current home cards (`TodayPlanCard`, `RecommendedNextCard`).
- `src/components/ide/PythonIDE.tsx`
  - Legacy IDE shell not used by current session flow.
- `src/components/problems/ProblemPreviewDrawer.tsx`
- `src/components/session/CodeEditor.tsx`
- `src/components/session/GuidedFixPanel.tsx`
- `src/components/session/SimulatedEditor.tsx`
  - Legacy session/preview components not wired in current routes.
- `src/components/ui/demo.tsx`
- `src/components/ui/EtherealShadow.tsx`
- `src/components/ui/pattern-text.tsx`
- `src/components/ui/text-shimmer.tsx`
- `src/components/ui/noise-background.tsx`
- `src/components/ui/Divider.tsx`
  - Unused UI experiments/duplicates.
- `src/assets/branding/PebbleLogoDark.png`
- `src/assets/branding/PebbleLogoLight.png`
  - Deprecated brand assets replaced by `src/assets/brand/*`.

If any archived file is needed again, move it back into `src` and rewire imports explicitly.

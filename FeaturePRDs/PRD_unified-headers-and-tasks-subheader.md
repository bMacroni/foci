# PRD: Unified Screen Headers & Tasks Subheader Layout

## North Star
Deliver a consistent, accessible, and compact header experience across primary app screens, modeled after the Guided Brain Dump header. For Tasks, add a single-line dashboard row beneath the header that shows key counts and actions without crowding.

## Background
- Headers across screens were inconsistent in spacing, typography, and action placement.
- The Tasks screen displayed stacked elements, causing overlap and excessive whitespace on phones.

## Objectives
1. Establish a reusable header that standardizes title typography, layout, and optional actions.
2. Refactor Calendar, Goals, Tasks, and AI Chat screens to use the shared header.
3. Introduce a compact “dashboard row” under the Tasks header containing:
   - "X auto-scheduled • Y scheduled • Z tasks" on the left
   - Gear (settings) and Auto‑Schedule button on the right
   - Reduced vertical spacing between header and Today’s Focus.

## Out of Scope
- Navigation structure changes
- New scheduling logic
- Additional actions beyond those listed

## UX & UI Requirements
- Title: left-aligned, bold, xl; consistent color per theme system
- Optional leftAction (e.g., menu) and rightActions (icons/buttons)
- Divider option under header for separation
- Touch targets ≥ 44px; icons via Octicons using the existing theme colors

## Accessibility
- Accessible labels for all interactive header icons/buttons
- Sufficient contrast for text and icons

## Acceptance Criteria
1. A reusable `ScreenHeader` component exists with props: `title`, `leftAction?`, `rightActions?`, `withDivider?`, `containerStyle?`.
2. Calendar, Goals, Tasks, and AI Chat render titles via `ScreenHeader` with consistent typography and spacing.
3. Tasks screen shows a single-line dashboard beneath the header:
   - Left: “X auto‑scheduled • Y scheduled • Z tasks” (updates based on state)
   - Right: Gear icon and Auto‑Schedule button aligned horizontally
   - Minimal vertical padding above Today’s Focus (compact spacing)
4. No overlapping UI at small phone widths; components wrap or compact as implemented.
5. Help icon appears in each header’s rightActions area (not absolutely positioned);
6. Safe area respected so headers aren’t occluded by the system tray.
7. Lint passes without new errors.

## QA Checklist
- [ ] Verify header typography and spacing matches Brain Dump reference
- [ ] Verify Tasks dashboard row appears on one line on common phone sizes
- [ ] Verify actions are reachable with 44px touch targets
- [ ] Verify no overlaps when dynamic counts grow
- [ ] Dark/light mode visual check

## Engineering Notes
- Octicons per project guidelines
- No new dependencies added
- Files touched:
  - `mobile/src/components/common/ScreenHeader.tsx`
  - `mobile/src/screens/calendar/CalendarScreen.tsx`
  - `mobile/src/screens/goals/GoalsScreen.tsx`
  - `mobile/src/screens/tasks/TasksScreen.tsx`
  - `mobile/src/screens/ai/AIChatScreen.tsx`



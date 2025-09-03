# PRD: Pop-up Help System (Mobile)

### Summary

This document outlines the requirements for a screen-specific, contextual help system for the Foci **mobile application**. After re-evaluation, this system will be implemented using the `react-native-popable` library to provide flexible, on-demand tooltips. The system is activated by a help icon placed on each screen. When active, users can tap highlighted UI elements to reveal a pop-up containing a verbose description of that element's function.

-----

### Product Goals

  * **Improve Discoverability**: Help new and existing users understand the functionality of on-screen elements without needing to consult external documentation.
  * **Reduce User Friction**: Provide immediate, contextual answers to "What does this button do?" questions, reducing cognitive load.
  * **Explain Complex Features**: Provide clear, detailed explanations for advanced workflows and settings, going beyond simple labels to explain the value and purpose.
  * **Reliable Implementation**: Build a polished and stable help experience by leveraging the robust `react-native-popable` library for its core tooltip functionality.

-----

### User Stories

  * **New User Onboarding**: As a new user, I want to quickly learn the main functions of the app so I can start setting my goals and tasks confidently.
  * **Feature Exploration**: As an existing user, I want to understand what a new or unfamiliar icon does so I can decide if I want to use that feature.
  * **Complex Feature Understanding**: As a user encountering a complex setting, I want a detailed tooltip that explains its purpose and benefit (e.g., "Momentum mode: enable to allow our system to set your next most likely task..."), so I can make an informed decision.

-----

### Functional Requirements

#### 1\. Help Mode Activation and Deactivation

  * [ ] **(Mobile)** Implement a global `HelpContext` to track the active state of the help overlay (`isHelpOverlayActive: boolean`) and hold the help content for the *currently visible screen*.
  * [ ] **(Mobile)** Each screen that provides help content must render its own help icon (`?`) button in a location that best fits the screen's layout.
  * [ ] **(Mobile)** Tapping a screen's help icon will set the global `isHelpOverlayActive` state to `true`.
  * [ ] **(Mobile)** When `isHelpOverlayActive` is `true`, render a full-screen, semi-transparent overlay to indicate help mode is active.
  * [ ] **(Mobile)** The overlay must have a close button ('X') and also be dismissible by tapping the background.

#### 2\. Screen-Specific Help Content Configuration

  * [ ] **(Mobile)** Each screen with a help system will define its own content as a map where keys are `helpId` strings and values are the corresponding verbose `helpText` strings. Screens without this content will not display a help icon.
  * [ ] **(Mobile)** When a screen mounts, it will provide its help content object to the `HelpContext`.
  * [ ] **(Mobile)** Example configuration within a screen file:
    ```javascript
    const helpContent = {
      'momentum-mode-toggle': 'Momentum mode: Enable to allow our system to set your next most likely task once you complete your current focus task.',
      'add-new-goal-button': 'Tap here to start a new goal. Our AI assistant will guide you through breaking it down into manageable steps.'
    };
    ```

#### 3\. Highlighting and Displaying Pop-ups

  * [ ] **(Mobile)** Create a wrapper component, `HelpTarget.tsx`, that accepts a single prop: `helpId: string`.
  * [ ] **(Mobile)** This component will wrap the target UI element with the `<Popable>` component from the `react-native-popable` library. The verbose `helpText` (looked up from the context via `helpId`) will be passed to the `content` prop of the `<Popable>` component.
  * [ ] **(Mobile)** The `HelpTarget` will consume the `HelpContext`. When `isHelpOverlayActive` is `true`, it will:
      * Render a visual outline around its child element (the help target).
      * Enable the `onPress` action to trigger the pop-up.
  * [ ] **(Mobile)** When `isHelpOverlayActive` is `false`, the `<Popable>` component should be disabled to prevent it from appearing during normal app use.

-----

### UX Notes

  * **Pop-up Styling**: The pop-up container provided by `react-native-popable` should be styled to match the app's minimal black and white theme. It must gracefully handle multi-line, verbose text.
  * **Visual Highlighting**: The visual outline on help targets should only be visible when help mode is active.
  * **Animations**: Use subtle, non-disruptive animations for the pop-ups appearing and disappearing.
  * **Icon Placement**: The help icon's position should be consistent where possible, but can be adjusted per-screen to avoid obstructing critical UI elements.

-----

### Edge Cases & Clarifying Questions

  * **Disabled Elements**: How should the help system treat disabled buttons?
      * **Suggestion**: The `HelpTarget` should still be active, and the `helpText` should explain *why* the element is disabled (e.g., "You must enter a goal title before you can save").
  * **Content Management**: For V1, is defining help content as structured objects within each screen component acceptable?
      * **Clarifying Question**: Should we consider a centralized content file (e.g., a single JSON for all screens) to make management and future localization easier, or is the screen-by-screen approach preferred for now?
  * **Trigger Method**: The `react-native-popable` library can be triggered by long-press, press-in, etc. Should the help system *only* be triggered by a standard `onPress` when help mode is active to ensure consistent behavior?
      * **Suggestion**: Yes, standard `onPress` should be the only trigger to maintain predictability for the user.
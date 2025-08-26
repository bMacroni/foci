Understood. I've updated the PRD to include the account linking feature.

---

# PRD: Mobile Google Sign-On with Firebase

## Summary
This document outlines the requirements for implementing Google Sign-On for the Foci mobile application. This feature will use the Firebase SDK on the client-side to handle the Google authentication flow and a new backend endpoint to integrate with the existing Supabase authentication system. The goal is to provide users with a seamless, one-tap sign-up and login experience while automatically enabling Google Calendar integration. **This includes a secure flow for linking a Google account to an existing email-based account.**

---

## Product Goals
- **Simplify Onboarding:** Reduce friction for new users by offering a one-tap sign-up/login option via their Google account.
- **Enhance User Experience:** Provide a fast, secure, and familiar authentication method on the mobile platform.
- **Streamline Calendar Integration:** Automatically capture the necessary permissions and tokens for Google Calendar sync upon sign-in, leveraging the existing backend infrastructure.
- **Provide a Unified User Identity:** Allow users to link multiple authentication methods to a single account for greater flexibility.

---

## User Stories
- **As a new user**, I want to sign up for Foci using my Google account so I don't have to create and remember a new password.
- **As an existing user**, I want to sign in with my Google account for quick and easy access to the app.
- **As a user signing in with Google**, I want my account to be automatically configured for Google Calendar event imports so the app's scheduling features work without extra steps.
- **As a user with an existing email/password account**, I want to link my Google account so I can use Google to sign in from now on without creating a duplicate account.

---

## Functional Requirements

### 1. Mobile Client (React Native)

- [ ] **Integrate Firebase SDK:**
    - Add and configure the necessary Firebase packages for authentication (`@react-native-firebase/app`, `@react-native-firebase/auth`) in the `mobile/` project.
    - Complete the platform-specific setup for both iOS and Android, including configuring Google services files (`GoogleService-Info.plist` and `google-services.json`).

- [ ] **Update Authentication UI:**
    - Add a "Sign in with Google" button to the `LoginScreen.tsx` and `SignupScreen.tsx` components. The button must comply with Google's branding guidelines.

- [ ] **Implement Google Sign-In Flow:**
    - On button tap, trigger the native Google Sign-In flow using the Firebase SDK.
    - Request the following OAuth scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/calendar.events.readonly`.
    - Upon successful authentication with Google, retrieve the **ID Token** and the **Access Token** from the sign-in result.

- [ ] **Backend Communication:**
    - Create a new function in the mobile API service (`mobile/src/services/api.ts`) to send the retrieved `idToken` and `accessToken` to a backend endpoint (`POST /api/auth/google/mobile-signin`).
    - [cite_start]On receiving a successful response from the backend, securely store the returned **Supabase JWT** using the existing authentication service (`mobile/src/services/auth.ts`)[cite: 160].
    - Update the `AuthContext` to use the new Supabase session, enabling authenticated API calls throughout the app.

- [ ] **Handle Account Linking Flow:**
    - The mobile client must handle a specific `linking_required` response from the `/mobile-signin` endpoint.
    - Upon receiving this response, display a modal or a dedicated screen that informs the user an account with their email already exists.
    - This UI must prompt the user to enter the password for their existing Foci account to verify their identity and link the accounts.
    - On submission, send the password and the original Google `idToken` to a new `POST /api/auth/google/link-account` endpoint.
    - If linking is successful, store the returned Supabase JWT and proceed with login.

### 2. Backend (Node.js/Express)

- [ ] **Integrate Firebase Admin SDK:**
    - Add the `firebase-admin` package to the backend dependencies.
    - Initialize the Firebase Admin SDK in the server configuration using a service account key.

- [ ] **Create New Authentication Endpoint (`/mobile-signin`):**
    - Implement a new route `POST /api/auth/google/mobile-signin` in `backend/src/routes/auth.js`. This endpoint will not be protected by the `requireAuth` middleware.
    - In the controller, perform the following steps:
        1. Receive and verify the Google `idToken`.
        2. Extract the user's email from the verified token.
        3. Check if a user with that email already exists in the Supabase `auth.users` table.
        4. **If the user does not exist:** Create a new user in Supabase, store their Google tokens, and return a new Supabase session.
        5. **If a user exists and signed up with Google:** Log them in and return a new Supabase session.
        6. **If a user exists but signed up with email/password:** Return a specific JSON response `{ "status": "linking_required" }` with an HTTP 409 Conflict status code.

- [ ] **Create Account Linking Endpoint (`/link-account`):**
    - Implement a new route `POST /api/auth/google/link-account` in `backend/src/routes/auth.js`.
    - In the controller, perform the following steps:
        1. Receive the user's password and the Google `idToken`.
        2. Verify the `idToken` again to ensure its validity.
        3. Use the email from the token to look up the existing Supabase user.
        4. Verify the received password against the existing user's credentials using Supabase's authentication functions.
        5. If the password is correct, update the Supabase user account to link the new Google identity.
        6. `Upsert` the Google `accessToken` into the `google_tokens` table.
        7. Return a new, valid Supabase session to the mobile client.

---

## UX Notes
- The "Sign in with Google" button should be prominently displayed on the login and sign-up screens.
- Use a loading indicator or spinner to provide feedback to the user during the sign-in and linking processes.
- When an existing account is detected, the app must clearly explain why the user needs to enter their password, framing it as a **one-time security step** to connect their accounts.
- The password input modal for account linking should include a "Forgot Password?" link that triggers the standard password reset flow.

---

## Edge Cases & Clarifying Questions
- **Incorrect Password during Linking:** What happens if the user enters the wrong password during the linking process?
    - **Proposed Solution:** The backend should return a `401 Unauthorized` error. The mobile app should display an "Incorrect password" message and allow the user to retry a few times before suggesting the "Forgot Password?" flow.
- **Multiple Google Accounts:** Can a user link more than one Google account to their Foci profile?
    - **Proposed Solution:** For this implementation, a Foci account can only be linked to a single Google identity.
- **User Cancels Linking:** What if the user sees the "link account" prompt and decides to cancel?
    - **Proposed Solution:** The app should return them to the main login screen. They can then choose to sign in with their original email and password.


# **PRD: Foci Mobile Calendar Page**

## **Summary**

This document outlines the product requirements for adding a dedicated calendar page to the Foci mobile application. This feature will provide users with a mobile-optimized view of their scheduled tasks and events, allowing for easy management and interaction on the go. The calendar will sync with the user's Google Calendar and the existing Foci backend, ensuring a consistent experience with the desktop application.

---

## **Product Goals**

* To provide users with a clear and interactive mobile calendar to view their scheduled tasks and events.  
* To enable users to create, modify, and delete events directly from their mobile device.  
* To ensure seamless two-way synchronization with Google Calendar and the Foci database.  
* To maintain the minimalist design philosophy of the Foci brand, ensuring a clean and focused user experience.  
* To create a foundation for future mobile-specific productivity features like daily digests and smart notifications.

---

## **User Stories**

### **Viewing the Calendar**

* As a user, I want to see all my scheduled tasks and events for a given day, week, and month on my mobile device.  
* As a user, I want to easily switch between daily, weekly, and monthly calendar views.  
* As a user, I want to be able to tap on an event or task to see its details.

### **Managing Events**

* As a user, I want to create a new event by tapping on an empty time slot in the calendar.  
* As a user, I want to edit the title, description, date, and time of an existing event.  
* As a user, I want to delete an event from my calendar.  
* As a user, I want to be able to create recurring events.

### **Task Integration**

* As a user, I want to see my Foci tasks automatically appear on my mobile calendar.  
* As a user, I want to drag and drop a task to reschedule it.  
* As a user, I want to be able to mark a task as complete from the calendar view.

---

## **Functional Requirements**

### **1\. Mobile Calendar UI/UX**

* [x] Implement a new "Calendar" tab in the main mobile navigation.  
* [x] Develop calendar views for **Day**, **Week**, and **Month**.  
* [x] The **Day** view should display a chronological list of the day's events and tasks.  
* [x] The **Week** view should present a 7-day layout.  
* [x] The **Month** view should give a high-level overview, possibly with dots or color-coding to indicate days with events.  
* [x] Ensure the UI is responsive and optimized for various mobile screen sizes.  
* [x] A "Today" button should be easily accessible to navigate back to the current date.

### **2\. Event and Task Display**

* [x] Fetch and display events from the user's synced Google Calendar via the existing /api/calendar/events endpoint.  
* [x] Fetch and display tasks from the Foci database via the existing /api/tasks endpoint.  
* [x] Differentiate between tasks and events visually (e.g., different colors or icons).  
* [x] Tapping on an event or task should open a detail view with its title, description, time, and any associated goal.  
* [x] The detail view for a task should include an option to mark it as "complete".

### **3\. Event Creation and Modification**

* [x] Implement a "Create Event" floating action button (FAB) or a tap-and-hold gesture on a time slot.  
* [x] The "Create Event" form should include fields for title, description, start/end time, and an option for recurring events.  
* [x] User input for event creation should be sent to the backend via the POST /api/calendar/events endpoint.  
* [x] The event detail view should have an "Edit" button that opens a pre-filled form for modification.  
* [x] Edited event data should be sent to the PUT /api/calendar/events/:id endpoint.  
* [x] Implement a "Delete" option in the event detail view, which calls the DELETE /api/calendar/events/:id endpoint.  
* [ ] Support for **drag-and-drop** to reschedule events and tasks within the week view. This interaction should trigger a call to the appropriate update endpoint.

### **4\. Backend and Synchronization**

* [x] No new backend endpoints are required as per the README.md. The existing calendar.js and tasks.js routes should be utilized.  
* [x] Ensure that all changes made on the mobile calendar are immediately synced with the backend and, subsequently, with Google Calendar.  
* [x] Implement real-time updates using Supabase's real-time subscription feature, as mentioned in the tech stack, to reflect changes made from other devices.

### **5\. Mobile-Specific UX Considerations**

* [ ] Use **haptic feedback** for interactions like creating an event or completing a task to enhance the user experience.  
* [x] Implement smooth animations and transitions when switching between calendar views.  
* [x] Utilize optimistic UI updates for a faster perceived performance when creating or modifying events.  
* [x] Adhere to the existing black and white, minimal design philosophy of the Foci app.

---

## **Implementation Progress (Updated: Current Date)**

### **✅ Completed Features:**

1. **Calendar Navigation & Views**
   - [x] Calendar tab integrated into main navigation
   - [x] Day, Week, and Month views implemented
   - [x] Automatic switching to Day view when date is selected
   - [x] "Today" button functionality

2. **Event & Task Display**
   - [x] Events fetched from backend API (200 events, 7 days prior to 30 days ahead)
   - [x] Tasks integrated from Foci database
   - [x] Visual differentiation between events and tasks
   - [x] Full-size event cards with complete details
   - [x] Event details with edit/delete/complete options

3. **Event Management**
   - [x] Floating Action Button (FAB) for event creation
   - [x] Event creation form with all required fields
   - [x] Event editing functionality
   - [x] Event deletion with confirmation
   - [x] Task completion from calendar view

4. **Backend Integration**
   - [x] Backend proxy approach implemented (secure Supabase interaction)
   - [x] Row Level Security (RLS) configured and working
   - [x] Service role key implementation for backend operations
   - [x] Real-time data synchronization

5. **List-Based Day View** ✅ **NEW**
   - [x] Time blocks (Early Morning, Morning, Afternoon, Evening)
   - [x] Full-size, readable event cards
   - [x] Proper event grouping and sorting
   - [x] Empty state handling for each time block
   - [x] Mobile-optimized layout with better UX

6. **List-Based Week View** ✅ **NEW**
   - [x] Date groups for each day of the week
   - [x] Full-size, readable event cards
   - [x] Proper event grouping and sorting by date
   - [x] Empty state handling for each date group
   - [x] Mobile-optimized layout with better UX

7. **Enhanced Month View with Goals** ✅ **NEW**
   - [x] Goals section below calendar showing upcoming goals for the month
   - [x] Goal cards with title, description, due date, and category
   - [x] Progress tracking showing completed milestones
   - [x] Goals marked on calendar with visual indicators
   - [x] Proper sorting by due date and title

8. **Quick Reschedule Menu** ✅ **NEW**
   - [x] Long press on events to show reschedule options
   - [x] Quick options: Today, Tomorrow, Next Week
   - [x] Platform-specific implementation (iOS ActionSheet, Android Alert)
   - [x] Support for both calendar events and tasks
   - [x] Visual clock icon to indicate rescheduling capability
   - [x] Works across Day, Week, and Month views

### **🔄 In Progress / Issues:**

1. **Day View Layout Redesign** ✅ **COMPLETED**
   - [x] **ISSUE**: Time grid interface too cramped and unreadable
   - [x] **SOLUTION**: Implemented list-based day view with time blocks
   - [x] **RESULT**: Much better readability and mobile-friendly interface

2. **Quick Reschedule Menu** ✅ **COMPLETED**
   - [x] **IMPLEMENTED**: Long press menu for quick rescheduling
   - [x] **FEATURES**: Platform-specific UI, common date options
   - [x] **SUPPORT**: Works for both events and tasks across all views

3. **Haptic Feedback** ✅ **COMPLETED**
   - [x] **IMPLEMENTED**: Haptic feedback for all key interactions
   - [x] **FEATURES**: Light, medium, heavy impacts, success, error, warning feedback
   - [x] **INTERACTIONS**: Card taps, long press, button presses, form submissions

### **🔧 Technical Architecture:**

1. **Backend Proxy Pattern**
   - [x] Mobile app communicates only with backend
   - [x] Backend handles all Supabase interactions
   - [x] Service role key bypasses RLS for secure operations
   - [x] Environment variables properly configured

2. **Data Format Handling**
   - [x] Support for both database format and Google Calendar API format
   - [x] Flexible event parsing in EventCard and CalendarScreen
   - [x] Proper date/time handling with timezone considerations

3. **Component Architecture**
   - [x] Modular calendar components (EventCard, EventFormModal)
   - [x] Reusable API services (calendarAPI, tasksAPI)
   - [x] TypeScript interfaces for type safety

4. **Date/Time Picker Implementation** ✅ **NEW**
   - [x] **MIGRATION**: Rolled back custom date picker implementation
   - [x] **LIBRARY**: Switched from `@react-native-community/datetimepicker` to `react-native-modal-datetime-picker`
   - [x] **REASON**: Resolved persistent `TypeError: Cannot read property 'dismiss' of undefined` error on Android
   - [x] **IMPLEMENTATION**: Updated EventFormModal, TaskForm, and AutoSchedulingPreferencesModal components
   - [x] **FEATURES**: Modal-based picker with `onConfirm` and `onCancel` props for better lifecycle management
   - [x] **DEPENDENCIES**: Removed `@react-native-picker/picker` and `@react-native-community/datetimepicker`
   - [x] **PLATFORM**: Works consistently across iOS and Android

### **📋 Next Steps:**

1. **Immediate Priority**: ✅ **COMPLETED** - Haptic feedback implemented
   - ✅ Installed and configured haptic feedback library
   - ✅ Added feedback for key interactions (card taps, long press, button presses)

2. **Secondary Priority**: Enhance reschedule menu
   - Add custom date picker for "Custom Date" option
   - Add more quick options (15min later, 1hr later, etc.)
   - Add undo functionality for rescheduling

3. **Enhancement**: Month view improvements
   - Consider list-based approach for month view as well
   - Add quick event creation from month view

---

## **Edge Cases & Clarifying Questions**

* **Offline Support**: How should the mobile calendar behave when the user has no internet connection? Should it cache data and sync later?  
* **Time Zone Handling**: How will the app handle events created in different time zones to prevent scheduling conflicts? The backend should be the source of truth for time zone conversions.  
* **All-Day Events**: How will all-day events be displayed in the day and week views?  
* **Overlapping Events**: How will the UI represent events and tasks that have overlapping times?  
* **Permissions**: What is the expected flow if the user has not yet granted Google Calendar permissions?  
* **React Native Component Library**: The project is built with React. For the mobile app mentioned in the roadmap ("React Native mobile app development"), which calendar library will be used? Popular options include react-native-calendars and react-native-calendar-kit. A decision on this will impact the implementation details.

---

## **Technical Notes**

### **Current Implementation Details:**
- **Calendar Library**: `react-native-calendars` (selected and implemented)
- **Backend Integration**: Backend proxy pattern with Supabase service role key
- **Data Fetching**: 200 events, 7 days prior to 30 days ahead
- **Day View**: List-based layout with time blocks (Early Morning, Morning, Afternoon, Evening)
- **Week View**: List-based layout with date groups for each day
- **Month View**: Calendar grid with goals section below showing upcoming goals
- **Event Cards**: Full-size cards with complete details and actions

### **Known Issues:**

1. **Date Picker Error** ⚠️ **NEW - PENDING INVESTIGATION**
   - **ERROR**: Unspecified error reported after migration to `react-native-modal-datetime-picker`
   - **STATUS**: Error details not provided, requires investigation
   - **IMPACT**: Date/time selection functionality may be affected
   - **NEXT STEPS**: Debug and resolve the new error when time permits
   - **DATE REPORTED**: Current session

2. **Previous Issues (Resolved)** ✅
   - **RESOLVED**: `TypeError: Cannot read property 'dismiss' of undefined` error on Android
   - **SOLUTION**: Migrated from `@react-native-community/datetimepicker` to `react-native-modal-datetime-picker`
   - **STATUS**: Fixed and working

### **Files Modified:**
- `mobile/src/screens/calendar/CalendarScreen.tsx` - Main calendar screen
- `mobile/src/components/calendar/EventCard.tsx` - Enhanced event component with reschedule menu
- `mobile/src/components/calendar/EventFormModal.tsx` - Event creation/editing (updated with new date picker)
- `mobile/src/components/tasks/TaskForm.tsx` - Task creation/editing (updated with new date picker)
- `mobile/src/components/tasks/AutoSchedulingPreferencesModal.tsx` - Auto-scheduling preferences (updated with new date picker)
- `mobile/src/services/api.ts` - API service functions
- `mobile/src/types/calendar.ts` - TypeScript interfaces
- `mobile/src/navigation/TabNavigator.tsx` - Navigation integration
- `backend/src/routes/calendar.js` - Backend calendar routes
- `mobile/package.json` - Dependencies updated (removed old picker libraries, added new modal picker)
- `mobile/src/components/common/CustomDateTimePicker.tsx` - **DELETED** (custom implementation rolled back)
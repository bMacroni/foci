

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

* \[ \] Implement a new "Calendar" tab in the main mobile navigation.  
* \[ \] Develop calendar views for **Day**, **Week**, and **Month**.  
* \[ \] The **Day** view should display a chronological list of the day's events and tasks.  
* \[ \] The **Week** view should present a 7-day layout.  
* \[ \] The **Month** view should give a high-level overview, possibly with dots or color-coding to indicate days with events.  
* \[ \] Ensure the UI is responsive and optimized for various mobile screen sizes.  
* \[ \] A "Today" button should be easily accessible to navigate back to the current date.

### **2\. Event and Task Display**

* \[ \] Fetch and display events from the user's synced Google Calendar via the existing /api/calendar/events endpoint.  
* \[ \] Fetch and display tasks from the Foci database via the existing /api/tasks endpoint.  
* \[ \] Differentiate between tasks and events visually (e.g., different colors or icons).  
* \[ \] Tapping on an event or task should open a detail view with its title, description, time, and any associated goal.  
* \[ \] The detail view for a task should include an option to mark it as "complete".

### **3\. Event Creation and Modification**

* \[ \] Implement a "Create Event" floating action button (FAB) or a tap-and-hold gesture on a time slot.  
* \[ \] The "Create Event" form should include fields for title, description, start/end time, and an option for recurring events.  
* \[ \] User input for event creation should be sent to the backend via the POST /api/calendar/events endpoint.  
* \[ \] The event detail view should have an "Edit" button that opens a pre-filled form for modification.  
* \[ \] Edited event data should be sent to the PUT /api/calendar/events/:id endpoint.  
* \[ \] Implement a "Delete" option in the event detail view, which calls the DELETE /api/calendar/events/:id endpoint.  
* \[ \] Support for **drag-and-drop** to reschedule events and tasks within the week view. This interaction should trigger a call to the appropriate update endpoint.

### **4\. Backend and Synchronization**

* \[ \] No new backend endpoints are required as per the README.md. The existing calendar.js and tasks.js routes should be utilized.  
* \[ \] Ensure that all changes made on the mobile calendar are immediately synced with the backend and, subsequently, with Google Calendar.  
* \[ \] Implement real-time updates using Supabase's real-time subscription feature, as mentioned in the tech stack, to reflect changes made from other devices.

### **5\. Mobile-Specific UX Considerations**

* \[ \] Use **haptic feedback** for interactions like creating an event or completing a task to enhance the user experience.  
* \[ \] Implement smooth animations and transitions when switching between calendar views.  
* \[ \] Utilize optimistic UI updates for a faster perceived performance when creating or modifying events.  
* \[ \] Adhere to the existing black and white, minimal design philosophy of the Foci app.

---

## **Edge Cases & Clarifying Questions**

* **Offline Support**: How should the mobile calendar behave when the user has no internet connection? Should it cache data and sync later?  
* **Time Zone Handling**: How will the app handle events created in different time zones to prevent scheduling conflicts? The backend should be the source of truth for time zone conversions.  
* **All-Day Events**: How will all-day events be displayed in the day and week views?  
* **Overlapping Events**: How will the UI represent events and tasks that have overlapping times?  
* **Permissions**: What is the expected flow if the user has not yet granted Google Calendar permissions?  
* **React Native Component Library**: The project is built with React. For the mobile app mentioned in the roadmap ("React Native mobile app development"), which calendar library will be used? Popular options include react-native-calendars and react-native-calendar-kit. A decision on this will impact the implementation details.
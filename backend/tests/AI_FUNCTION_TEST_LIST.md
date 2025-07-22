# 🧪 AI Function Call Test List

This document contains a comprehensive list of chat requests to test all AI function calls in the MindGarden application.

## **Task Functions**

### **Create Task**
- "Add a task to buy groceries for tomorrow"
- "Create a new task called 'Call mom' with high priority"
- "Remind me to finish the project report by Friday"
- "Add a task to clean the garage this weekend"

### **Read Tasks**
- "Show me my tasks"
- "List my tasks for today"
- "What tasks are related to my fitness goal?"
- "Show me all my high priority tasks"

### **Update Tasks**
- "Change the due date for my homework task to next Monday"
- "Mark the laundry task as complete"
- "Update the priority of my grocery shopping task to high"
- "Change the description of my project task"

### **Delete Tasks**
- "Delete my laundry task"
- "Remove the call mom task"
- "Delete the grocery shopping task"

### **Lookup Tasks** (Precursor function)
- "What tasks do I have?" (triggers lookup before other operations)

---

## **Goal Functions**

### **Create Goals**
- "Set a goal to run a marathon by December"
- "Create a new goal for reading more books"
- "I want to learn Spanish this year"
- "Set a goal to save $10,000 by the end of the year"

### **Read Goals**
- "Show me my goals"
- "List my goals"
- "What are my current goals?"

### **Update Goals**
- "Change the due date for my marathon goal to next June"
- "Update the description of my reading goal"
- "Change the priority of my Spanish learning goal to high"

### **Delete Goals**
- "Delete the goal 'Test goal'"
- "Remove my goal called 'Get fit'"
- "Delete my marathon goal"

### **Lookup Goals** (Precursor function)
- "What goals do I have?" (triggers lookup before other operations)

---

## **Calendar Event Functions**

### **Create Calendar Events**
- "Schedule a meeting for tomorrow at 10am"
- "Add a calendar event for my doctor appointment next Friday at 2pm"
- "Create an event for team lunch on Wednesday at noon"
- "Schedule a call with John for Monday at 3pm"

### **Read Calendar Events**
- "Show me my calendar events"
- "List my events for next week"
- "What events do I have on Friday?"
- "Show me my calendar for tomorrow"

### **Update Calendar Events**
- "Change the time of my meeting to 11am"
- "Update the location for my doctor appointment to the downtown office"
- "Change my team lunch to Thursday instead of Wednesday"

### **Delete Calendar Events**
- "Delete my meeting on Friday"
- "Remove the doctor appointment from my calendar"
- "Cancel my team lunch event"

### **Lookup Calendar Events** (Precursor function)
- "What events do I have?" (triggers lookup before other operations)

---

## **Complex Multi-Step Scenarios** (Test the AI's ability to chain functions)

1. **"I want to create a goal to get fit, then add some tasks to help me achieve it"**
   - Should trigger: `lookup_goal` → `create_goal` → `create_task` (multiple times)

2. **"Schedule a meeting for next week, then create a task to prepare for it"**
   - Should trigger: `create_calendar_event` → `create_task`

3. **"Show me my goals, then update the one about fitness"**
   - Should trigger: `read_goal` → `lookup_goal` → `update_goal`

4. **"What tasks do I have? I want to delete the one about groceries"**
   - Should trigger: `lookup_task` → `delete_task`

---

## **Edge Cases to Test**

1. **Ambiguous requests**: "Delete my task" (when multiple tasks exist)
2. **Non-existent items**: "Update my goal called 'Non-existent goal'"
3. **Incomplete data**: "Create a task" (without title)
4. **Natural language dates**: "Schedule something for next Friday"
5. **Priority variations**: "High priority task", "urgent task", "important task"

---

## **Testing Strategy**

1. **Start with simple CRUD operations** for each function type
2. **Test the lookup functions** to ensure they work as precursors
3. **Test multi-step scenarios** to verify function chaining
4. **Test edge cases** to identify potential issues
5. **Test natural language variations** to ensure robust parsing

---

## **Function Mapping Reference**

| Function Name | Purpose | Trigger Examples |
|---------------|---------|------------------|
| `create_task` | Creates new tasks | "Add a task", "Create a task", "Remind me to" |
| `read_task` | Lists user tasks | "Show me my tasks", "List tasks" |
| `update_task` | Updates existing tasks | "Change", "Update", "Mark as complete" |
| `delete_task` | Removes tasks | "Delete", "Remove" |
| `lookup_task` | Gets task IDs for operations | Precursor to update/delete |
| `create_goal` | Creates new goals | "Set a goal", "Create a goal" |
| `read_goal` | Lists user goals | "Show me my goals", "List goals" |
| `update_goal` | Updates existing goals | "Change goal", "Update goal" |
| `delete_goal` | Removes goals | "Delete goal", "Remove goal" |
| `lookup_goal` | Gets goal IDs for operations | Precursor to update/delete |
| `create_calendar_event` | Creates calendar events | "Schedule", "Add calendar event" |
| `read_calendar_event` | Lists calendar events | "Show calendar", "List events" |
| `update_calendar_event` | Updates calendar events | "Change event", "Update event" |
| `delete_calendar_event` | Removes calendar events | "Delete event", "Remove event" |
| `lookup_calendar_event` | Gets event IDs for operations | Precursor to update/delete |

---

## **Notes for Testing**

- Test each function type systematically
- Verify that lookup functions work as precursors
- Check that multi-step scenarios execute correctly
- Monitor for any error handling issues
- Test with various natural language inputs
- Verify that the AI correctly interprets user intent 
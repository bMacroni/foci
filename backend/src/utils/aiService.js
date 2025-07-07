import { goalsAPI, tasksAPI, calendarAPI } from './apiService.js';

// Simple intent recognition and command processing
// In a production app, you'd use OpenAI GPT-4 or similar for better NLP

export class AIService {
  constructor() {
    // ======= BEGIN: Comment out direct command logic =======
    /*
    this.commands = {
      // Goal commands
      'add goal': this.addGoal,
      'create goal': this.addGoal,
      'new goal': this.addGoal,
      'show goals': this.getGoals,
      'list goals': this.getGoals,
      'my goals': this.getGoals,
      'update goal': this.updateGoal,
      'delete goal': this.deleteGoal,
      'complete goal': this.completeGoal,
      
      // Task commands
      'add task': this.addTask,
      'create task': this.addTask,
      'new task': this.addTask,
      'show tasks': this.getTasks,
      'list tasks': this.getTasks,
      'my tasks': this.getTasks,
      'update task': this.updateTask,
      'delete task': this.deleteTask,
      'complete task': this.completeTask,
      'mark done': this.completeTask,
      
      // Calendar commands
      'add event': this.addEvent,
      'create event': this.addEvent,
      'schedule': this.addEvent,
      'show events': this.getEvents,
      'list events': this.getEvents,
      'my calendar': this.getEvents,
      'update event': this.updateEvent,
      'delete event': this.deleteEvent,
      
      // General commands
      'help': this.showHelp,
      'what can you do': this.showHelp,
      'suggestions': this.getGoalSuggestions,
      'get suggestions': this.getGoalSuggestions,
      'goal suggestions': this.getGoalSuggestions,
    };

    async processMessage(message, userId) {
      const lowerMessage = message.toLowerCase();
      let response = { message: '', actions: [] };

      try {
        // Check for specific commands
        for (const [command, handler] of Object.entries(this.commands)) {
          if (lowerMessage.includes(command)) {
            response = await handler.call(this, message, userId);
            break;
          }
        }

        // If no specific command found, provide general help
        if (!response.message) {
          response = await this.showHelp(message, userId);
        }

      } catch (error) {
        console.error('AI Service Error:', error);
        response = {
          message: "I'm sorry, I encountered an error processing your request. Please try again.",
          actions: []
        };
      }

      return response;
    }

    // Goal handlers
    async addGoal(message, userId) { /* ... */ }
    async getGoals(message, userId) { /* ... */ }
    // Task handlers
    async addTask(message, userId) { /* ... */ }
    async getTasks(message, userId) { /* ... */ }
    // Calendar handlers
    async addEvent(message, userId) { /* ... */ }
    async getEvents(message, userId) { /* ... */ }
    // Other handlers
    async updateGoal(message, userId) { /* ... */ }
    async deleteGoal(message, userId) { /* ... */ }
    async completeGoal(message, userId) { /* ... */ }
    async updateTask(message, userId) { /* ... */ }
    async deleteTask(message, userId) { /* ... */ }
    async completeTask(message, userId) { /* ... */ }
    async updateEvent(message, userId) { /* ... */ }
    async deleteEvent(message, userId) { /* ... */ }
    async showHelp(message, userId) { /* ... */ }
    async getGoalSuggestions(message, userId) { /* ... */ }
    */
    // ======= END: Comment out direct command logic =======
  }
}

export default AIService; 
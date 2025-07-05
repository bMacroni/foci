import { goalsAPI, tasksAPI, calendarAPI } from './apiService.js';

// Simple intent recognition and command processing
// In a production app, you'd use OpenAI GPT-4 or similar for better NLP

export class AIService {
  constructor() {
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
  }

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
  async addGoal(message, userId) {
    const goalMatch = message.match(/(?:add|create|new)\s+goal\s+(?:to\s+)?(.+)/i);
    if (!goalMatch) {
      return {
        message: "I'd be happy to help you create a goal! Please specify what goal you'd like to add. For example: 'Add a goal to learn React'",
        actions: []
      };
    }

    const goalTitle = goalMatch[1].trim();
    const goalData = {
      title: goalTitle,
      description: `Goal: ${goalTitle}`,
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: 'in_progress'
    };

    try {
      await goalsAPI.create(goalData);
      return {
        message: `Great! I've created a new goal: "${goalTitle}". You can view and manage it in the Goals tab.`,
        actions: [`Created goal: ${goalTitle}`]
      };
    } catch (error) {
      return {
        message: "I couldn't create the goal. Please try again or check the Goals tab to create it manually.",
        actions: []
      };
    }
  }

  async getGoals(message, userId) {
    try {
      const response = await goalsAPI.getAll();
      const goals = response.data;
      
      if (goals.length === 0) {
        return {
          message: "You don't have any goals yet. Try saying 'Add a goal to learn something new' to get started!",
          actions: []
        };
      }

      const goalList = goals.map(goal => `• ${goal.title} (${goal.status})`).join('\n');
      return {
        message: `Here are your current goals:\n\n${goalList}\n\nYou can manage these in the Goals tab.`,
        actions: [`Retrieved ${goals.length} goals`]
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your goals. Please check the Goals tab to view them.",
        actions: []
      };
    }
  }

  // Task handlers
  async addTask(message, userId) {
    const taskMatch = message.match(/(?:add|create|new)\s+task\s+(?:to\s+)?(.+)/i);
    if (!taskMatch) {
      return {
        message: "I'd be happy to help you create a task! Please specify what task you'd like to add. For example: 'Add a task to review documents'",
        actions: []
      };
    }

    const taskTitle = taskMatch[1].trim();
    const taskData = {
      title: taskTitle,
      description: `Task: ${taskTitle}`,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'pending'
    };

    try {
      await tasksAPI.create(taskData);
      return {
        message: `Perfect! I've created a new task: "${taskTitle}". You can view and manage it in the Tasks tab.`,
        actions: [`Created task: ${taskTitle}`]
      };
    } catch (error) {
      return {
        message: "I couldn't create the task. Please try again or check the Tasks tab to create it manually.",
        actions: []
      };
    }
  }

  async getTasks(message, userId) {
    try {
      const response = await tasksAPI.getAll();
      const tasks = response.data;
      
      if (tasks.length === 0) {
        return {
          message: "You don't have any tasks yet. Try saying 'Add a task to organize your workspace' to get started!",
          actions: []
        };
      }

      const taskList = tasks.map(task => `• ${task.title} (${task.status})`).join('\n');
      return {
        message: `Here are your current tasks:\n\n${taskList}\n\nYou can manage these in the Tasks tab.`,
        actions: [`Retrieved ${tasks.length} tasks`]
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your tasks. Please check the Tasks tab to view them.",
        actions: []
      };
    }
  }

  // Calendar handlers
  async addEvent(message, userId) {
    const eventMatch = message.match(/(?:add|create|schedule)\s+(?:event\s+)?(.+)/i);
    if (!eventMatch) {
      return {
        message: "I'd be happy to help you schedule an event! Please specify what event you'd like to add. For example: 'Schedule a meeting tomorrow at 2pm'",
        actions: []
      };
    }

    const eventTitle = eventMatch[1].trim();
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const eventData = {
      summary: eventTitle,
      description: `Event: ${eventTitle}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    try {
      await calendarAPI.createEvent(eventData);
      return {
        message: `Excellent! I've scheduled an event: "${eventTitle}" for ${startTime.toLocaleString()}. You can view it in your Google Calendar or the Calendar tab.`,
        actions: [`Scheduled event: ${eventTitle}`]
      };
    } catch (error) {
      return {
        message: "I couldn't schedule the event. Please make sure your Google Calendar is connected or try creating it manually in the Calendar tab.",
        actions: []
      };
    }
  }

  async getEvents(message, userId) {
    try {
      const response = await calendarAPI.getEvents(10);
      const events = response.data;
      
      if (events.length === 0) {
        return {
          message: "You don't have any upcoming events. Try saying 'Schedule a meeting' to add one!",
          actions: []
        };
      }

      const eventList = events.map(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return `• ${event.summary} (${start.toLocaleDateString()} at ${start.toLocaleTimeString()})`;
      }).join('\n');

      return {
        message: `Here are your upcoming events:\n\n${eventList}\n\nYou can manage these in the Calendar tab.`,
        actions: [`Retrieved ${events.length} events`]
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your events. Please make sure your Google Calendar is connected or check the Calendar tab.",
        actions: []
      };
    }
  }

  // Placeholder handlers for other commands
  async updateGoal(message, userId) {
    return {
      message: "I can help you update goals! Please go to the Goals tab to edit your goals, or tell me which goal you'd like to update.",
      actions: []
    };
  }

  async deleteGoal(message, userId) {
    return {
      message: "I can help you delete goals! Please go to the Goals tab to manage your goals, or tell me which goal you'd like to delete.",
      actions: []
    };
  }

  async completeGoal(message, userId) {
    return {
      message: "I can help you complete goals! Please go to the Goals tab to mark goals as complete, or tell me which goal you'd like to complete.",
      actions: []
    };
  }

  async updateTask(message, userId) {
    return {
      message: "I can help you update tasks! Please go to the Tasks tab to edit your tasks, or tell me which task you'd like to update.",
      actions: []
    };
  }

  async deleteTask(message, userId) {
    return {
      message: "I can help you delete tasks! Please go to the Tasks tab to manage your tasks, or tell me which task you'd like to delete.",
      actions: []
    };
  }

  async completeTask(message, userId) {
    return {
      message: "I can help you complete tasks! Please go to the Tasks tab to mark tasks as done, or tell me which task you'd like to complete.",
      actions: []
    };
  }

  async updateEvent(message, userId) {
    return {
      message: "I can help you update events! Please go to the Calendar tab to edit your events, or tell me which event you'd like to update.",
      actions: []
    };
  }

  async deleteEvent(message, userId) {
    return {
      message: "I can help you delete events! Please go to the Calendar tab to manage your events, or tell me which event you'd like to delete.",
      actions: []
    };
  }

  async showHelp(message, userId) {
    return {
      message: `I'm your MindGarden AI assistant! Here's what I can help you with:

🎯 **Goals:**
• "Add a goal to learn React"
• "Show my goals"
• "Create a goal to exercise daily"
• "Get suggestions for my goal"

📋 **Tasks:**
• "Add a task to review documents"
• "Show my tasks"
• "Create a task to call the client"

📅 **Calendar:**
• "Schedule a meeting tomorrow at 2pm"
• "Show my events"
• "Add an event for team lunch"

Try any of these commands to get started!`,
      actions: []
    };
  }

  async getGoalSuggestions(message, userId) {
    // Extract goal title from the message
    const suggestionMatch = message.match(/(?:suggestions?|get suggestions?|goal suggestions?)\s+(?:for\s+)?(.+)/i);
    
    if (!suggestionMatch) {
      return {
        message: "I'd be happy to provide suggestions for your goal! Please specify which goal you'd like suggestions for. For example: 'Get suggestions for my goal to learn React' or 'Suggestions for improving my fitness'",
        actions: []
      };
    }

    const goalTitle = suggestionMatch[1].trim();
    
    // Generate basic suggestions based on the goal title
    const suggestions = this.generateBasicSuggestions(goalTitle);
    
    return {
      message: `Here are some actionable suggestions for your goal "${goalTitle}":\n\n${suggestions}\n\nYou can also use the "Get AI Suggestions" button in the goal form for more personalized recommendations!`,
      actions: [`Generated suggestions for: ${goalTitle}`]
    };
  }

  generateBasicSuggestions(goalTitle) {
    const lowerTitle = goalTitle.toLowerCase();
    
    // Generic suggestions that work for most goals
    const genericSuggestions = [
      "• Break down the goal into smaller, manageable steps with specific deadlines",
      "• Create a detailed action plan with weekly milestones and progress tracking",
      "• Set up regular check-ins (daily/weekly) to monitor your progress",
      "• Identify potential obstacles and create backup plans for each",
      "• Celebrate small wins along the way to maintain motivation",
      "• Find an accountability partner or join a community for support",
      "• Use productivity tools and apps to track your progress systematically"
    ];

    // Category-specific suggestions
    if (lowerTitle.includes('learn') || lowerTitle.includes('study') || lowerTitle.includes('education')) {
      return [
        "• Create a structured learning schedule with dedicated study time",
        "• Break down the subject into smaller topics and tackle them one by one",
        "• Use active learning techniques like practice problems and teaching others",
        "• Set up a study environment that minimizes distractions",
        "• Track your learning progress with quizzes and assessments",
        "• Join study groups or online communities for support and motivation",
        "• Apply what you learn through practical projects or real-world practice"
      ].join('\n');
    }
    
    if (lowerTitle.includes('fitness') || lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('health')) {
      return [
        "• Start with a realistic exercise schedule that fits your lifestyle",
        "• Begin with low-impact activities and gradually increase intensity",
        "• Set specific fitness milestones (e.g., run 5K, do 10 push-ups)",
        "• Track your workouts and progress in a fitness app or journal",
        "• Find workout buddies or join fitness classes for accountability",
        "• Focus on building sustainable habits rather than quick results",
        "• Include both cardio and strength training in your routine"
      ].join('\n');
    }
    
    if (lowerTitle.includes('save') || lowerTitle.includes('money') || lowerTitle.includes('finance') || lowerTitle.includes('budget')) {
      return [
        "• Create a detailed budget tracking your income and expenses",
        "• Set up automatic savings transfers to make saving effortless",
        "• Identify areas where you can reduce spending (subscriptions, dining out)",
        "• Set specific savings milestones and celebrate reaching them",
        "• Research investment options to grow your savings over time",
        "• Build an emergency fund before focusing on other financial goals",
        "• Use apps to track your spending and identify patterns"
      ].join('\n');
    }
    
    if (lowerTitle.includes('career') || lowerTitle.includes('job') || lowerTitle.includes('work') || lowerTitle.includes('professional')) {
      return [
        "• Identify specific skills you need to develop for your career goals",
        "• Create a professional development plan with timelines",
        "• Network with professionals in your field through events and LinkedIn",
        "• Seek mentorship or coaching from experienced colleagues",
        "• Take on challenging projects that stretch your abilities",
        "• Build a portfolio showcasing your best work and achievements",
        "• Stay updated with industry trends and best practices"
      ].join('\n');
    }

    // Return generic suggestions if no specific category is identified
    return genericSuggestions.join('\n');
  }
}

export default AIService; 
import React, { createContext, useContext, useState, useCallback } from 'react';

const AIActionContext = createContext();

export function AIActionProvider({ children }) {
  const [calendarEvents, setCalendarEvents] = useState(null); // null = not shown, [] = empty
  const [error, setError] = useState(null);

  // Process AI response and update state accordingly
  const processAIResponse = useCallback((response) => {
    setError(null);
    setCalendarEvents(null);
    if (!response) return;
    // If response is a JSON array of events
    if (Array.isArray(response)) {
      setCalendarEvents(response);
      return;
    }
    // If response is an error object
    if (response && typeof response === 'object' && response.error) {
      setError(response.error);
      setCalendarEvents([]);
      return;
    }
    // Otherwise, clear events
    setCalendarEvents(null);
  }, []);

  return (
    <AIActionContext.Provider value={{ calendarEvents, error, processAIResponse }}>
      {children}
    </AIActionContext.Provider>
  );
}

export function useAIAction() {
  return useContext(AIActionContext);
} 
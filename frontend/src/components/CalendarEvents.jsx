import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';

// Accept events and error as props for AI integration
const CalendarEvents = ({ events: propEvents, error: propError }) => {
  // If events are provided as props, use them directly (AI mode)
  if (propEvents !== undefined) {
    if (propError) {
      return (
        <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{propError}</span>
          </div>
        </div>
      );
    }
    if (!Array.isArray(propEvents) || propEvents.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No events scheduled for this date</h3>
          <p className="text-gray-600">Perfect time to plan your day and add some structure!</p>
        </div>
      );
    }
    // Render a simple list of events for the date
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8 my-6">
        <h3 className="text-2xl font-bold text-black mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Events for Selected Date
        </h3>
        <ul className="divide-y divide-gray-200">
          {propEvents.map(event => (
            <li key={event.id} className="py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-lg text-black">{event.title || event.summary}</div>
                  {event.description && <div className="text-gray-600 text-sm mb-1">{event.description}</div>}
                  <div className="text-gray-500 text-sm">
                    <span>🕒 {formatEventTime(event.start)}{event.end ? ` → ${formatEventTime(event.end)}` : ''}</span>
                    {event.location && <span className="ml-4">📍 {event.location}</span>}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getEvents(50);
      setEvents(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      if (err.response?.status === 401) {
        setError('Google Calendar not connected. Please connect your account first.');
      } else {
        setError('Failed to load calendar events');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (dateTime) => {
    if (!dateTime) return 'No time specified';
    const date = new Date(dateTime.dateTime || dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime.dateTime || dateTime);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getEventsForDate = (date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const eventsArray = Array.isArray(events) ? events : [];
    return eventsArray.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start);
      return eventStart >= targetDate && eventStart < nextDate;
    }).sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start);
      const timeB = new Date(b.start.dateTime || b.start);
      return timeA - timeB;
    });
  };

  const getEventsForWeek = () => {
    const weekEvents = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - date.getDay() + i);
      weekEvents.push({
        date: new Date(date),
        events: getEventsForDate(date)
      });
    }
    return weekEvents;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const getEventColor = (event) => {
    // Simple color coding based on event title
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800'
    ];
    const index = event.summary?.length || 0;
    return colors[index % colors.length];
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Today is your day to shine!",
      "Small steps lead to big changes!",
      "You've got this! Every task completed is progress!",
      "Focus on what you can control today!",
      "Your future self will thank you!",
      "One task at a time, you're building your dreams!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await calendarAPI.createEvent(eventData);
      setShowCreateForm(false);
      loadEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      await calendarAPI.updateEvent(eventId, eventData);
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await calendarAPI.deleteEvent(eventId);
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8">
      {/* Header with motivational message */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black">
              Daily Agenda
            </h3>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Event</span>
            </span>
          </button>
        </div>
        
        {/* Motivational message */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
          <p className="text-center text-lg font-semibold text-black">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* View mode toggle and date navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                viewMode === 'daily'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                viewMode === 'weekly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              This Week
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-black">
              {viewMode === 'daily' 
                ? selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
                : `Week of ${selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
              }
            </span>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {showCreateForm && (
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setShowCreateForm(false)}
          title="Create New Event"
        />
      )}

      {editingEvent && (
        <EventForm
          event={editingEvent}
          onSubmit={(data) => handleUpdateEvent(editingEvent.id, data)}
          onCancel={() => setEditingEvent(null)}
          title="Edit Event"
        />
      )}

      {/* Calendar View */}
      {viewMode === 'daily' ? (
        <DailyView 
          events={getEventsForDate(selectedDate)}
          onEdit={setEditingEvent}
          onDelete={handleDeleteEvent}
          getEventColor={getEventColor}
          formatEventTime={formatEventTime}
          getTimeSlots={getTimeSlots}
        />
      ) : (
        <WeeklyView 
          weekEvents={getEventsForWeek()}
          onEdit={setEditingEvent}
          onDelete={handleDeleteEvent}
          getEventColor={getEventColor}
          formatEventTime={formatEventTime}
        />
      )}
    </div>
  );
};

// Daily View Component
const DailyView = ({ events, onEdit, onDelete, getEventColor, formatEventTime, getTimeSlots }) => {
  const timeSlots = getTimeSlots();
  const eventsArray = Array.isArray(events) ? events : [];

  if (eventsArray.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-black mb-2">No events scheduled for today</h3>
        <p className="text-gray-600">Perfect time to plan your day and add some structure!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 rounded-2xl p-6">
      <div className="space-y-4">
        {timeSlots.map(hour => {
          const hourEvents = eventsArray.filter(event => {
            const eventHour = new Date(event.start.dateTime || event.start).getHours();
            return eventHour === hour;
          });

          return (
            <div key={hour} className="flex">
              <div className="w-20 flex-shrink-0 text-sm font-medium text-gray-500 pt-2">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div className="flex-1 ml-4">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`mb-3 p-4 rounded-xl border-2 ${getEventColor(event)} hover:shadow-lg transition-all duration-200`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">{event.summary}</h4>
                        {event.description && (
                          <p className="text-sm opacity-80 mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium">⏰ {formatEventTime(event.start)}</span>
                          {event.end && (
                            <span className="font-medium">→ {formatEventTime(event.end)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => onEdit(event)}
                          className="p-1 text-current opacity-70 hover:opacity-100 transition-opacity"
                          title="Edit event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(event.id)}
                          className="p-1 text-current opacity-70 hover:opacity-100 transition-opacity"
                          title="Delete event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Weekly View Component
const WeeklyView = ({ weekEvents, onEdit, onDelete, getEventColor, formatEventTime }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-gray-50/50 rounded-2xl p-6">
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => (
          <div key={day} className="space-y-2">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">{day}</div>
              <div className={`text-lg font-bold ${
                weekEvents[index]?.date.toDateString() === new Date().toDateString()
                  ? 'text-blue-600'
                  : 'text-black'
              }`}>
                {weekEvents[index]?.date.getDate()}
              </div>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {weekEvents[index]?.events.map(event => (
                <div
                  key={event.id}
                  className={`p-2 rounded-lg border text-xs ${getEventColor(event)} hover:shadow-md transition-all duration-200 cursor-pointer`}
                  onClick={() => onEdit(event)}
                >
                  <div className="font-medium truncate">{event.summary}</div>
                  <div className="opacity-80">{formatEventTime(event.start)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Event Form Component (simplified for brevity)
const EventForm = ({ event, onSubmit, onCancel, title }) => {
  const [formData, setFormData] = useState({
    summary: event?.summary || '',
    description: event?.description || '',
    start: event?.start?.dateTime ? event.start.dateTime.split('T')[0] + 'T' + event.start.dateTime.split('T')[1].substring(0, 5) : '',
    end: event?.end?.dateTime ? event.end.dateTime.split('T')[0] + 'T' + event.end.dateTime.split('T')[1].substring(0, 5) : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({...formData, start: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({...formData, end: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEvents; 
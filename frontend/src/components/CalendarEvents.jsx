import React, { useState, useEffect, useRef } from 'react';
import { calendarAPI } from '../services/api';
import SuccessToast from './SuccessToast';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const CalendarEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [dragging, setDragging] = useState(false);
  const calendarRef = useRef(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getEvents(100);
      setEvents(Array.isArray(response.data) ? response.data : []);
      setError(null);
      console.log('[CalendarEvents] Events loaded:', response.data);
    } catch (err) {
        setError('Failed to load calendar events');
      console.error('[CalendarEvents] Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };
  const handleCloseToast = () => setToast({ ...toast, isVisible: false });

  // --- Monthly Calendar Logic ---
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const getMonthDays = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const days = [];
    // Fill leading days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // Fill current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIndex, d));
    }
    // Fill trailing days to complete the grid
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  };

  const monthDays = getMonthDays(currentMonth);

  // --- Click and Drag Selection ---
  const handleDayMouseDown = (date) => {
    setSelectedRange({ start: date, end: date });
    setDragging(true);
  };
  const handleDayMouseEnter = (date) => {
    if (dragging && selectedRange.start) {
      setSelectedRange({ start: selectedRange.start, end: date });
    }
  };
  const handleMouseUp = () => {
    setDragging(false);
  };
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging]);

  const isSelected = (date) => {
    if (!selectedRange.start || !date) return false;
    const start = selectedRange.start < selectedRange.end ? selectedRange.start : selectedRange.end;
    const end = selectedRange.start > selectedRange.end ? selectedRange.start : selectedRange.end;
    return date >= start && date <= end;
  };

  // Utility to check if a date is today
  function isToday(date) {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
    }

  // --- Filter Events for Selected Range ---
  const getEventsForRange = () => {
    if (!selectedRange.start || !selectedRange.end) return [];
    const start = selectedRange.start < selectedRange.end ? selectedRange.start : selectedRange.end;
    const end = selectedRange.start > selectedRange.end ? selectedRange.start : selectedRange.end;
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= start && eventDate <= end;
    });
  };

  // --- Calendar Navigation ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // --- Drag-and-drop event move handler ---
  const handleMoveEvent = async (event, newDay, newHour, newMin) => {
    const start = new Date(newDay);
    start.setHours(newHour, newMin, 0, 0);
    let end = null;
    if (event.end) {
      const duration = new Date(event.end.dateTime || event.end) - new Date(event.start.dateTime || event.start);
      end = new Date(start.getTime() + (duration > 0 ? duration : 60 * 60 * 1000));
    } else {
      // Default to 1 hour if no end
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    // Optimistically update local state
    const prevEvents = [...events];
    setEvents(events => events.map(ev =>
      ev.id === event.id
        ? {
            ...ev,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            start: { ...ev.start, dateTime: start.toISOString() },
            end: { ...ev.end, dateTime: end.toISOString() }
          }
        : ev
    ));
    try {
      const payload = {
        summary: event.summary || event.title || '',
        description: event.description || '',
        startTime: start.toISOString(),
        endTime: end.toISOString()
      };
      await calendarAPI.updateEvent(event.id, payload);
      showToast('Event updated!', 'success');
      // Optionally reload events for full sync
      // await loadEvents();
    } catch (err) {
      setEvents(prevEvents);
      showToast('Failed to update event', 'error');
      console.error('[CalendarEvents] Error updating event:', err);
      console.error('[CalendarEvents] Backend error:', err.response?.data);
    }
  };

  // --- Events for selected range, grouped by day and hour ---
  function getTimeSlots() {
    const slots = [];
    for (let hour = 4; hour <= 22; hour++) { // Start at 4:00 AM
      for (let min = 0; min < 60; min += 15) {
        slots.push({ hour, min });
      }
    }
    return slots;
    }
  const TIME_SLOTS = getTimeSlots();

  function getRangeDays(start, end) {
    if (!start || !end) return [];
    const days = [];
    let d = new Date(start < end ? start : end);
    const last = new Date(start > end ? start : end);
    d.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);
    while (d <= last) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
    }

  const ItemTypes = { EVENT: 'event' };

  // Utility to strip HTML tags from a string
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Utility to get the number of 15-min slots an event spans
  function getEventSlotSpan(event) {
    const start = new Date(event.startTime || event.start?.dateTime || event.start);
    const end = new Date(event.endTime || event.end?.dateTime || event.end);
    const duration = Math.max(15, (end - start) / (1000 * 60)); // at least 15 min
    return Math.ceil(duration / 15);
  }

  // Utility to check if two events overlap in time
  function eventsOverlap(eventA, eventB) {
    const startA = new Date(eventA.startTime || eventA.start?.dateTime || eventA.start);
    const endA = new Date(eventA.endTime || eventA.end?.dateTime || eventA.end);
    const startB = new Date(eventB.startTime || eventB.start?.dateTime || eventB.start);
    const endB = new Date(eventB.endTime || eventB.end?.dateTime || eventB.end);
    return startA < endB && startB < endA;
  }

  // Utility to get all events that overlap with a given slot time
  function getOverlappingEvents(events, slotTime) {
    return events.filter(event => {
      const start = new Date(event.startTime || event.start?.dateTime || event.start);
      const end = new Date(event.endTime || event.end?.dateTime || event.end);
      return start <= slotTime && end > slotTime;
    });
    }

  function DraggableEventCard({ event, onClick, slotHeight = 28, style = {} }) {
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.EVENT,
      item: { id: event.id, event },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => !resizing, // Prevent drag when resizing
    });
    const slotSpan = getEventSlotSpan(event);
    const [resizing, setResizing] = useState(false);
    const [resizeEnd, setResizeEnd] = useState(null);
    const [justResized, setJustResized] = useState(false); // Track if last action was resize
    const startTime = new Date(event.startTime || event.start?.dateTime || event.start);
    const endTime = resizeEnd || new Date(event.endTime || event.end?.dateTime || event.end);
    const timeRange = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Handle resizing logic
    const cardRef = useRef();
    useEffect(() => {
      if (!resizing) return;
      function onMouseMove(e) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const y = e.clientY - cardRect.top;
        let minutes = Math.round(y / slotHeight * 15);
        minutes = Math.max(15, Math.round(minutes / 15) * 15); // snap to 15 min, min 15 min
        const newEnd = new Date(startTime.getTime() + minutes * 60 * 1000);
        if (newEnd > startTime) setResizeEnd(newEnd);
      }
      function onMouseUp() {
        setResizing(false);
        if (resizeEnd && resizeEnd > startTime) {
          // Save new end time
          handleResizeEnd(event, resizeEnd);
          setJustResized(true); // Mark that we just resized
        }
        setResizeEnd(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }, [resizing, resizeEnd, startTime]);

    // Only attach drag ref if not resizing
    const setRefs = node => {
      cardRef.current = node;
      if (node && !resizing) {
        drag(node);
    }
    };

    // Prevent modal opening if just resized
    const handleCardClick = e => {
      e.stopPropagation();
      if (justResized) {
        setJustResized(false);
        return;
      }
      onClick(event);
    };

    // Tooltip logic for truncated text
    const titleRef = useRef();
    const [showTooltip, setShowTooltip] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    useEffect(() => {
      if (titleRef.current) {
        setIsTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
    }, [event.title, event.summary]);

    return (
      <div
        ref={setRefs}
        onClick={handleCardClick}
        className={`bg-white border border-gray-200 rounded-xl shadow-md p-2 mb-2 cursor-pointer transition-all absolute left-0 w-full
          ${isDragging ? 'opacity-40 scale-95' : ''}
          hover:shadow-xl hover:scale-[1.03] focus:shadow-xl focus:scale-[1.03] active:scale-100
          flex flex-col justify-center items-center relative
          ${resizing ? 'ring-2 ring-blue-400 z-30' : ''}
        `}
        style={{
          minHeight: slotHeight,
          height: ((resizeEnd ? (resizeEnd - startTime) / (1000 * 60) : slotSpan * 15) / 15) * slotHeight - 4,
          zIndex: resizing ? 30 : 2,
          ...style,
          transition: resizing ? 'none' : 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1), height 0.3s cubic-bezier(.4,0,.2,1)',
        }}
        tabIndex={0}
      >
        <span
          className="inline-block bg-black/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm absolute top-0 right-0 z-10"
          style={{
            marginTop: '-8px',
            marginRight: '-8px',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
            transition: 'box-shadow 0.2s',
          }}
        >
          {timeRange}
        </span>
        <div className="flex-1 w-full flex items-center justify-center">
          <div
            ref={titleRef}
            className="font-semibold text-black text-sm truncate text-center w-full px-2 relative"
            onMouseEnter={() => isTruncated && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: isTruncated ? 'pointer' : 'default' }}
          >
            {event.title || event.summary}
            {showTooltip && isTruncated && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-fade-in">
                {event.title || event.summary}
              </div>
            )}
          </div>
        </div>
        {/* Resize handle at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-3 flex items-center justify-center cursor-ns-resize z-20"
          style={{
            borderRadius: 4,
            background: resizing ? '#3b82f6' : '#e5e7eb',
            boxShadow: resizing ? '0 0 0 2px #3b82f6' : '0 1px 4px 0 rgba(0,0,0,0.07)',
            transition: 'background 0.2s, box-shadow 0.2s',
            marginBottom: -6,
          }}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            setResizing(true);
          }}
          draggable={false}
          title="Resize event"
        >
          <div className="w-4 h-1 rounded-full bg-gray-400" />
        </div>
      </div>
    );
  }

  // Update handleResizeEnd to reload events after resize
  async function handleResizeEnd(event, newEnd) {
    const start = new Date(event.startTime || event.start?.dateTime || event.start);
    if (newEnd <= start) return;
    // Optimistically update local state
    const prevEvents = [...events];
    setEvents(events => events.map(ev =>
      ev.id === event.id
        ? { ...ev, endTime: newEnd.toISOString(), end: { ...ev.end, dateTime: newEnd.toISOString() } }
        : ev
    ));
    try {
      const payload = {
        summary: event.summary || event.title || '',
        description: event.description || '',
        startTime: start.toISOString(),
        endTime: newEnd.toISOString()
      };
      await calendarAPI.updateEvent(event.id, payload);
      // Optionally reload events for full sync
      // await loadEvents();
    } catch (err) {
      // Revert local change and show error
      setEvents(prevEvents);
      showToast('Failed to resize event', 'error');
      console.error('Failed to resize event', err);
    }
  }

  // Event Edit Modal
  function EventEditModal({ event, onClose, onSave }) {
    const [form, setForm] = useState({
      title: event.title || event.summary || '',
      description: event.description || '',
      start: event.start?.dateTime || event.start,
      end: event.end?.dateTime || event.end,
    });
    const [saving, setSaving] = useState(false);
    const [show, setShow] = useState(false);
    useEffect(() => { setShow(true); }, []);
    const handleChange = e => {
      const { name, value } = e.target;
      setForm(f => ({ ...f, [name]: value }));
    };
    const handleSubmit = async e => {
      e.preventDefault();
      setSaving(true);
      try {
        await onSave({ ...event, ...form });
        setShow(false);
        setTimeout(onClose, 200);
      } finally {
        setSaving(false);
      }
    };
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.40)' }}
    >
      <div className={`bg-white rounded-3xl shadow-xl border border-black/10 p-8 max-w-md w-full relative max-h-screen overflow-y-auto transform transition-transform duration-200 ${show ? 'scale-100' : 'scale-95'}`}
        style={{ transition: 'transform 0.2s' }}
      >
          <button
          className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200"
          onClick={() => { setShow(false); setTimeout(onClose, 200); }}
          aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
        <h3 className="text-xl font-bold mb-4">Edit Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              name="start"
              value={form.start ? form.start.slice(0, 16) : ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              name="end"
              value={form.end ? form.end.slice(0, 16) : ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => { setShow(false); setTimeout(onClose, 200); }}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              disabled={saving}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

  function TimeSlot({ day, hour, min, events, onDropEvent, slotHeight = 28, className = '' }) {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: ItemTypes.EVENT,
      drop: (item) => {
        console.log('[CalendarEvents] Drop event:', {
          eventId: item.event.id,
          targetDay: day,
          targetHour: hour,
          targetMin: min
        });
        onDropEvent(item.event, day, hour, min);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });
    // Calculate slot time
    const slotTime = new Date(day);
    slotTime.setHours(hour, min, 0, 0);
    // Get all events that overlap with this slot
    const overlappingEvents = getOverlappingEvents(events, slotTime);
    // Assign column index for each overlapping event
    let columns = [];
    overlappingEvents.forEach(event => {
      // Find the first available column for this event
      let col = 0;
      while (columns.some(e => e.col === col && eventsOverlap(e.event, event))) {
        col++;
      }
      columns.push({ event, col });
    });
    const totalCols = columns.length > 0 ? Math.max(...columns.map(e => e.col)) + 1 : 1;
    return (
      <div
        ref={drop}
        className={`min-h-[${slotHeight}px] border-b border-gray-100 px-1 ${className} relative transition-all duration-150
          ${isOver && canDrop ? 'ring-2 ring-blue-500 bg-blue-100/40 z-20' : ''}
        `}
        style={{ position: 'relative', height: slotHeight }}
      >
        {columns.map(({ event, col }) => (
          // Only render the card if this is the first slot of the event
          (() => {
            const eventStart = new Date(event.startTime || event.start?.dateTime || event.start);
            if (eventStart.getTime() !== slotTime.getTime()) return null;
            const width = `${100 / totalCols}%`;
            const left = `${(100 / totalCols) * col}%`;
            return (
              <DraggableEventCard
                key={event.id}
                event={event}
                onClick={setEditingEvent}
                slotHeight={slotHeight}
                style={{ width, left }}
              />
            );
          })()
        ))}
      </div>
    );
  }

  // --- Calculate rangeDays and eventsByDayHour for rendering ---
  const rangeDays = getRangeDays(selectedRange.start, selectedRange.end);
  const eventsByDayTime = {};
  rangeDays.forEach(day => {
    const key = day.toDateString();
    eventsByDayTime[key] = {};
    TIME_SLOTS.forEach(({ hour, min }) => {
      eventsByDayTime[key][`${hour}:${min}`] = [];
    });
  });
  events.forEach(event => {
    const eventDate = new Date(event.start.dateTime || event.start);
    eventDate.setSeconds(0, 0);
    const dayKey = eventDate.toDateString();
    const hour = eventDate.getHours();
    const min = eventDate.getMinutes() - (eventDate.getMinutes() % 15);
    if (eventsByDayTime[dayKey] && eventsByDayTime[dayKey][`${hour}:${min}`]) {
      eventsByDayTime[dayKey][`${hour}:${min}`].push(event);
    }
  });

  // --- Render ---
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8">
      <SuccessToast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={handleCloseToast}
        type={toast.type}
      />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-black">Monthly Calendar</h3>
        </div>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-black text-lg">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-6 bg-red-50/80 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <span className="font-medium">{error}</span>
        </div>
      )}
      <div ref={calendarRef} className="grid grid-cols-7 gap-2 mb-8 select-none">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center font-semibold text-gray-500 mb-2">{d}</div>
        ))}
        {monthDays.map((date, idx) => (
          <div
            key={idx}
            className={`h-16 flex items-center justify-center rounded-xl cursor-pointer border transition-all
              ${date ?
                isSelected(date)
                  ? 'bg-black text-white border-black scale-105 shadow-lg'
                  : (date.toDateString() === today.toDateString() ? 'border-black/40 bg-gray-100 text-black font-bold' : 'bg-white border-gray-200 text-black hover:bg-gray-50')
                : 'bg-transparent border-none cursor-default'}
            `}
            onMouseDown={date ? () => handleDayMouseDown(date) : undefined}
            onMouseEnter={date ? () => handleDayMouseEnter(date) : undefined}
            onMouseUp={date ? handleMouseUp : undefined}
            style={{ userSelect: 'none' }}
          >
            {date ? date.getDate() : ''}
          </div>
        ))}
      </div>
      {/* --- Time Grid for Selected Range --- */}
      {rangeDays.length > 0 && (
        <DndProvider backend={HTML5Backend}>
          <div className="overflow-x-auto">
            <div className="min-w-[900px] relative">
              {/* Current time line overlay */}
              {(() => {
                // Only show if today is in rangeDays
                const todayIdx = rangeDays.findIndex(day => isToday(day));
                if (todayIdx === -1) return null;
                // Calculate vertical position
                const startHour = 4;
                const endHour = 22;
                const totalMinutes = (endHour - startHour) * 60;
                const now = currentTime;
                if (!isToday(now)) return null;
                const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
                if (minutesSinceStart < 0 || minutesSinceStart > totalMinutes) return null;
                // Height of one minute in px (based on slotHeight=22 for 15min slots)
                const slotHeight = 22;
                const pxPerMinute = slotHeight / 15;
                const top = minutesSinceStart * pxPerMinute + 36; // +36 for header offset
                // Calculate left/width for the current day column
                const left = `calc(80px + ${todayIdx} * (100% - 80px) / ${rangeDays.length})`;
                const width = `calc((100% - 80px) / ${rangeDays.length})`;
                // Debug log
                console.log('[CurrentTimeLine]', { top, left, width, todayIdx, now });
                return (
                  <div
                    className="pointer-events-none absolute left-0 w-full z-50"
                    style={{
                      top,
                      height: 0,
                    }}
                  >
                    <div
                      className="absolute"
                      style={{
                        left,
                        width,
                        borderTop: '3px solid #ef4444', // red-500
                        boxShadow: '0 0 8px 0 #ef4444',
                        zIndex: 50,
                        borderRadius: 2,
                        borderBottom: '1px dashed #ef4444', // debug border
                      }}
                    />
                  </div>
                );
              })()}
              <div className="grid gap-x-2" style={{ gridTemplateColumns: `80px repeat(${rangeDays.length}, 1fr)` }}>
                {/* Header Row */}
                <div></div>
                {rangeDays.map((day, idx) => (
                  <div
                    key={day.toDateString()}
                    className={`text-center font-bold text-black py-2 border-b border-black/10 ${isToday(day) ? 'bg-blue-50 border-blue-400' : (idx % 2 === 1 ? 'bg-gray-50' : 'bg-white')}`}
                  >
                    {day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                ))}
                {/* Time Rows */}
                {TIME_SLOTS.map(({ hour, min }, rowIdx) => (
                  <React.Fragment key={hour + ':' + min}>
                    <div
                      className={
                        min === 0
                          ? `text-sm font-bold text-black py-2 pr-2 border-r border-black border-t-2 text-right align-top ${rowIdx % 8 < 4 ? 'bg-gray-50' : 'bg-white'}` // alternate hour shading
                          : `text-xs text-gray-400 py-1 pr-2 border-r border-gray-100 border-t bg-white text-right align-top`
                      }
                      style={{ minHeight: min === 0 ? 36 : 22 }}
                    >
                      {min === 0
                        ? (hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`)
                        : `${min.toString().padStart(2, '0')}`}
                    </div>
                    {rangeDays.map((day, colIdx) => {
                      // Alternate day column shading
                      const isCurrentDay = isToday(day);
                      const isCurrentRow = isToday(day) && hour === today.getHours() && min === today.getMinutes();
                      let bg = '';
                      if (isCurrentDay && isCurrentRow) {
                        bg = 'bg-blue-100';
                      } else if (isCurrentDay) {
                        bg = 'bg-blue-50';
                      } else if (isCurrentRow) {
                        bg = 'bg-blue-50';
                      } else if (colIdx % 2 === 1) {
                        bg = rowIdx % 8 < 4 ? 'bg-gray-50' : 'bg-white';
                      } else {
                        bg = rowIdx % 8 < 4 ? 'bg-white' : 'bg-gray-50';
                      }
                      return (
                        <TimeSlot
                          key={day.toDateString() + hour + ':' + min}
                          day={day}
                          hour={hour}
                          min={min}
                          events={eventsByDayTime[day.toDateString()]?.[`${hour}:${min}`] || []}
                          onDropEvent={handleMoveEvent}
                          slotHeight={min === 0 ? 36 : 22}
                          // Add extra padding and background for whitespace and shading
                          className={`relative ${bg} rounded-md`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </DndProvider>
      )}
      {rangeDays.length === 0 && (
        <div className="text-gray-500">Select one or more days to view and manage events.</div>
      )}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={async (updatedEvent) => {
            await calendarAPI.updateEvent(updatedEvent.id, {
              ...updatedEvent,
              start: updatedEvent.start,
              end: updatedEvent.end,
            });
            showToast('Event updated!', 'success');
            loadEvents();
          }}
        />
      )}
    </div>
  );
};

export default CalendarEvents; 
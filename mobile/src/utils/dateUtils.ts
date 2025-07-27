export const dateUtils = {
    // Format date to readable string
    formatDate: (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString();
    },
  
    // Format date to relative time (e.g., "2 days ago")
    formatRelativeTime: (date: Date | string): string => {
      const now = new Date();
      const target = new Date(date);
      const diffInMs = now.getTime() - target.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
      
      return target.toLocaleDateString();
    },
  
    // Check if date is today
    isToday: (date: Date | string): boolean => {
      const today = new Date();
      const target = new Date(date);
      return today.toDateString() === target.toDateString();
    },
  
    // Check if date is in the past
    isPast: (date: Date | string): boolean => {
      const now = new Date();
      const target = new Date(date);
      return target < now;
    },
  
    // Add days to date
    addDays: (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },
  
    // Get start of day
    startOfDay: (date: Date): Date => {
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);
      return result;
    },
  
    // Get end of day
    endOfDay: (date: Date): Date => {
      const result = new Date(date);
      result.setHours(23, 59, 59, 999);
      return result;
    },
  };
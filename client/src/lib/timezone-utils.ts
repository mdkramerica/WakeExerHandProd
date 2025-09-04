// Centralized timezone handling utilities

/**
 * Parse a timestamp string and ensure it's treated as UTC if no timezone info is present
 */
export function parseTimestamp(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Check if timestamp already has timezone information
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
    // Has timezone info - parse normally
    return new Date(dateString);
  } else {
    // Legacy format without timezone - assume UTC and add Z
    return new Date(dateString + 'Z');
  }
}

/**
 * Format a timestamp in user's local timezone with consistent formatting
 */
export function formatLocalDateTime(dateString: string): { date: string; time: string } {
  const date = parseTimestamp(dateString);
  
  return {
    date: date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  };
}

/**
 * Format just the date in user's local timezone
 */
export function formatLocalDate(dateString: string): string {
  const date = parseTimestamp(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
}

/**
 * Format just the time in user's local timezone
 */
export function formatLocalTime(dateString: string): string {
  const date = parseTimestamp(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a compact date and time for lists
 */
export function formatCompactDateTime(dateString: string): string {
  const date = parseTimestamp(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

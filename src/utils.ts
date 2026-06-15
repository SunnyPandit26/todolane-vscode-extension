import * as crypto from 'crypto';
import { TodoPriority } from './types';

/**
 * Generate a UUID v4-style identifier using Node.js built-in crypto.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the emoji indicator for a priority level.
 */
export function priorityEmoji(priority: TodoPriority): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
  }
}

/**
 * Get a human-readable label for a priority level.
 */
export function priorityLabel(priority: TodoPriority): string {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
  }
}

/**
 * Format a due date string for display. Shows relative labels like
 * "Today 5:00 PM", "Tomorrow 3:00 PM", or "Jun 15, 2025 10:00 AM".
 * Returns empty string if no due date.
 */
export function formatDueDate(dueDateIso: string): string {
  if (!dueDateIso) {
    return '';
  }

  const due = new Date(dueDateIso);
  if (isNaN(due.getTime())) {
    return '';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const timeStr = due.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (dueDay.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  }
  if (dueDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`;
  }

  const dateStr = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: due.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${dateStr} ${timeStr}`;
}

/**
 * Check if a due date is overdue (past current time).
 */
export function isOverdue(dueDateIso: string): boolean {
  if (!dueDateIso) { return false; }
  const due = new Date(dueDateIso);
  return !isNaN(due.getTime()) && due.getTime() <= Date.now();
}

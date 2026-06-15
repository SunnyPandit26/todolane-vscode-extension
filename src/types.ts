/**
 * Priority levels for a todo item.
 */
export type TodoPriority = 'high' | 'medium' | 'low';

/**
 * Status of a todo item.
 */
export type TodoStatus = 'pending' | 'done' | 'cancelled';

/**
 * Filter options for the todo list view.
 */
export type TodoFilter = 'all' | 'pending' | 'done' | 'cancelled';

/**
 * A single todo item stored in .devbookmark/todos.json.
 */
export interface TodoItem {
  /** Unique identifier (UUID v4-style). */
  id: string;
  /** Title of the todo. */
  title: string;
  /** Optional description (max 200 words). */
  description: string;
  /** Priority level. */
  priority: TodoPriority;
  /** ISO 8601 due date-time string, or empty string if none. */
  dueDate: string;
  /** Current status. */
  status: TodoStatus;
  /** ISO 8601 timestamp when the todo was created. */
  createdAt: string;
  /** ISO 8601 timestamp when the todo was completed, or empty string. */
  completedAt: string;
  /** ISO 8601 timestamp when the todo was cancelled, or empty string. */
  cancelledAt: string;
  /** Whether the reminder has already been fired for this todo. */
  reminderFired: boolean;
  /** Whether the 5-minute advance reminder has been fired. */
  reminderAdvanceFired: boolean;
}

/**
 * Shape of the todos.json file.
 */
export interface TodosFile {
  version: number;
  todos: TodoItem[];
}

import * as vscode from 'vscode';
import { TodoItem, TodoPriority } from './types';
import { TodoStore } from './todoStore';
import { TodoTreeProvider } from './todoTreeProvider';
import { generateId } from './utils';

/** Maximum number of words allowed in a todo description. */
const MAX_DESCRIPTION_WORDS = 200;

/**
 * Validate that text does not exceed the word limit.
 */
function validateWordCount(text: string): string | null {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > MAX_DESCRIPTION_WORDS) {
    return `Description exceeds ${MAX_DESCRIPTION_WORDS} words (currently ${wordCount})`;
  }
  return null;
}

/**
 * Handles all todo CRUD commands invoked from the command palette or sidebar.
 */
export class TodoCommands {
  constructor(
    private store: TodoStore,
    private treeProvider: TodoTreeProvider
  ) {}

  /**
   * Create a new todo via multi-step input.
   */
  async newTodo(): Promise<void> {
    // Step 1: Title
    const title = await vscode.window.showInputBox({
      title: 'New Todo (1/4)',
      prompt: 'What do you need to do?',
      placeHolder: 'e.g., Fix auth bug in login flow',
      validateInput: (value) => value.trim() ? null : 'Title cannot be empty',
    });
    if (title === undefined) { return; }

    // Step 2: Description (optional, 200-word limit)
    const description = await vscode.window.showInputBox({
      title: 'New Todo (2/4)',
      prompt: `Add a description (optional, max ${MAX_DESCRIPTION_WORDS} words)`,
      placeHolder: 'e.g., The login endpoint returns 401 for valid tokens...',
      validateInput: (value) => {
        if (!value.trim()) { return null; } // empty is fine
        return validateWordCount(value);
      },
    });
    if (description === undefined) { return; }

    // Step 3: Priority
    const priorityPick = await vscode.window.showQuickPick(
      [
        { label: '🔴 High', value: 'high' as TodoPriority },
        { label: '🟡 Medium', value: 'medium' as TodoPriority },
        { label: '🟢 Low', value: 'low' as TodoPriority },
      ],
      {
        title: 'New Todo (3/4)',
        placeHolder: 'Select priority',
      }
    );
    if (!priorityPick) { return; }

    // Step 4: Due date & time (optional)
    const dueDate = await this.promptDueDate('New Todo (4/4)');
    if (dueDate === undefined) { return; } // cancelled

    const todo: TodoItem = {
      id: generateId(),
      title: title.trim(),
      description: (description || '').trim(),
      priority: priorityPick.value,
      dueDate: dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: '',
      cancelledAt: '',
      reminderFired: false,
      reminderAdvanceFired: false,
    };

    const todos = this.store.loadTodos();
    todos.push(todo);
    this.store.saveTodos(todos);
    this.treeProvider.refresh();

    vscode.window.showInformationMessage(`✅ Todo created: "${todo.title}"`);
  }

  /**
   * Edit an existing todo (title, description, priority, due date).
   */
  async editTodo(todoId: string): Promise<void> {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) {
      vscode.window.showErrorMessage('Todo not found.');
      return;
    }
    const todo = todos[idx];

    // What to edit?
    const field = await vscode.window.showQuickPick(
      [
        { label: '📝 Title', value: 'title' },
        { label: '📄 Description', value: 'description' },
        { label: '🎯 Priority', value: 'priority' },
        { label: '📅 Due Date & Time', value: 'dueDate' },
      ],
      { placeHolder: 'What would you like to edit?' }
    );
    if (!field) { return; }

    switch (field.value) {
      case 'title': {
        const newTitle = await vscode.window.showInputBox({
          prompt: 'New title',
          value: todo.title,
          validateInput: (v) => v.trim() ? null : 'Title cannot be empty',
        });
        if (newTitle === undefined) { return; }
        todo.title = newTitle.trim();
        break;
      }
      case 'description': {
        const newDesc = await vscode.window.showInputBox({
          prompt: `Edit description (max ${MAX_DESCRIPTION_WORDS} words)`,
          value: todo.description,
          validateInput: (v) => {
            if (!v.trim()) { return null; }
            return validateWordCount(v);
          },
        });
        if (newDesc === undefined) { return; }
        todo.description = newDesc.trim();
        break;
      }
      case 'priority': {
        const pick = await vscode.window.showQuickPick(
          [
            { label: '🔴 High', value: 'high' as TodoPriority },
            { label: '🟡 Medium', value: 'medium' as TodoPriority },
            { label: '🟢 Low', value: 'low' as TodoPriority },
          ],
          { placeHolder: `Current: ${todo.priority}` }
        );
        if (!pick) { return; }
        todo.priority = pick.value;
        break;
      }
      case 'dueDate': {
        const newDue = await this.promptDueDate('Edit Due Date');
        if (newDue === undefined) { return; }
        todo.dueDate = newDue;
        // Reset reminders if the due date changed
        todo.reminderFired = false;
        todo.reminderAdvanceFired = false;
        break;
      }
    }

    todos[idx] = todo;
    this.store.saveTodos(todos);
    this.treeProvider.refresh();
    vscode.window.showInformationMessage(`✏️ Todo updated: "${todo.title}"`);
  }

  /**
   * Mark a todo as done.
   */
  async markDone(todoId: string): Promise<void> {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) { return; }

    todos[idx].status = 'done';
    todos[idx].completedAt = new Date().toISOString();
    this.store.saveTodos(todos);
    this.treeProvider.refresh();
    vscode.window.showInformationMessage(`✅ Done: "${todos[idx].title}"`);
  }

  /**
   * Cancel a todo.
   */
  async cancelTodo(todoId: string): Promise<void> {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) { return; }

    todos[idx].status = 'cancelled';
    todos[idx].cancelledAt = new Date().toISOString();
    this.store.saveTodos(todos);
    this.treeProvider.refresh();
    vscode.window.showInformationMessage(`❌ Cancelled: "${todos[idx].title}"`);
  }

  /**
   * Delete a todo permanently.
   */
  async deleteTodo(todoId: string): Promise<void> {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) { return; }

    const title = todos[idx].title;

    const confirm = await vscode.window.showWarningMessage(
      `Delete "${title}" permanently?`,
      { modal: true },
      'Delete'
    );
    if (confirm !== 'Delete') { return; }

    todos.splice(idx, 1);
    this.store.saveTodos(todos);
    this.treeProvider.refresh();
    vscode.window.showInformationMessage(`🗑️ Deleted: "${title}"`);
  }

  /**
   * Prompt the user for a due date and time (optional).
   * Returns ISO string, empty string for "no due date", or undefined if cancelled.
   */
  private async promptDueDate(title: string): Promise<string | undefined> {
    const choice = await vscode.window.showQuickPick(
      [
        { label: '📅 Set due date & time', value: 'set' },
        { label: '⏭️ Skip (no due date)', value: 'skip' },
      ],
      { title, placeHolder: 'Set a due date?' }
    );
    if (!choice) { return undefined; }
    if (choice.value === 'skip') { return ''; }

    // Date input
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateStr = await vscode.window.showInputBox({
      title: `${title} — Date`,
      prompt: 'Enter date (YYYY-MM-DD)',
      value: defaultDate,
      validateInput: (v) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
          return 'Use format YYYY-MM-DD (e.g., 2025-06-15)';
        }
        const d = new Date(v + 'T00:00:00');
        if (isNaN(d.getTime())) { return 'Invalid date'; }
        return null;
      },
    });
    if (dateStr === undefined) { return undefined; }

    // Time input
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timeStr = await vscode.window.showInputBox({
      title: `${title} — Time`,
      prompt: 'Enter time (HH:MM, 24h format)',
      value: defaultTime,
      validateInput: (v) => {
        if (!/^\d{2}:\d{2}$/.test(v)) {
          return 'Use format HH:MM (e.g., 17:00)';
        }
        const [h, m] = v.split(':').map(Number);
        if (h < 0 || h > 23 || m < 0 || m > 59) { return 'Invalid time'; }
        return null;
      },
    });
    if (timeStr === undefined) { return undefined; }

    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }
}

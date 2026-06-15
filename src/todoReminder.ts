import * as vscode from 'vscode';
import { TodoItem } from './types';
import { TodoStore } from './todoStore';
import { TodoTreeProvider } from './todoTreeProvider';

/**
 * Advanced reminder system that fires real VS Code notifications:
 * 
 * 1. **5-minute advance warning** — "Your todo is due in 5 minutes!"
 * 2. **At due time** — Modal warning with action buttons (Mark Done / Snooze / Dismiss)
 * 3. **Status bar flash** — Blinking status bar to catch attention
 * 
 * Checks every 15 seconds for precision. Each reminder only fires once
 * (tracked via `reminderFired` and `reminderAdvanceFired` flags).
 */
export class TodoReminder implements vscode.Disposable {
  private timer: ReturnType<typeof setInterval> | undefined;
  private store: TodoStore;
  private treeProvider: TodoTreeProvider | undefined;
  private statusBarItem: vscode.StatusBarItem | undefined;
  private flashTimer: ReturnType<typeof setInterval> | undefined;

  /** Check interval in milliseconds (every 15 seconds for precision). */
  private static readonly CHECK_INTERVAL_MS = 15_000;

  /** Advance warning: 5 minutes before due time. */
  private static readonly ADVANCE_WARNING_MS = 5 * 60 * 1000;

  constructor(store: TodoStore) {
    this.store = store;
  }

  /**
   * Set the tree provider reference (for refreshing after snooze/done from reminder).
   */
  setTreeProvider(treeProvider: TodoTreeProvider): void {
    this.treeProvider = treeProvider;
  }

  /**
   * Start the reminder check loop.
   */
  start(): void {
    this.checkReminders();
    this.timer = setInterval(() => this.checkReminders(), TodoReminder.CHECK_INTERVAL_MS);
  }

  /**
   * Stop all timers and cleanup.
   */
  dispose(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.stopFlash();
    this.statusBarItem?.dispose();
  }

  /**
   * Check all pending todos for due reminders and fire notifications.
   */
  private checkReminders(): void {
    const todos = this.store.loadTodos();
    const now = Date.now();
    let changed = false;

    for (const todo of todos) {
      if (todo.status !== 'pending' || !todo.dueDate) {
        continue;
      }

      const dueTime = new Date(todo.dueDate).getTime();
      if (isNaN(dueTime)) {
        continue;
      }

      const timeUntilDue = dueTime - now;

      // 5-minute advance warning
      if (
        !todo.reminderAdvanceFired &&
        timeUntilDue > 0 &&
        timeUntilDue <= TodoReminder.ADVANCE_WARNING_MS
      ) {
        this.fireAdvanceReminder(todo);
        todo.reminderAdvanceFired = true;
        changed = true;
      }

      // Due time reached — fire main reminder
      if (!todo.reminderFired && timeUntilDue <= 0) {
        this.fireDueReminder(todo);
        todo.reminderFired = true;
        // Also mark advance as fired in case it was missed
        todo.reminderAdvanceFired = true;
        changed = true;
      }
    }

    if (changed) {
      this.store.saveTodos(todos);
    }
  }

  /**
   * 5-minute advance warning — gentle info notification.
   */
  private fireAdvanceReminder(todo: TodoItem): void {
    const dueDate = new Date(todo.dueDate);
    const timeStr = dueDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    vscode.window.showInformationMessage(
      `🔔 Heads up: "${todo.title}" is due in 5 minutes (at ${timeStr})`,
      'Mark Done Now',
      'OK'
    ).then(action => {
      if (action === 'Mark Done Now') {
        this.markDoneFromReminder(todo.id);
      }
    });
  }

  /**
   * Due time reached — urgent warning notification with action buttons.
   */
  private async fireDueReminder(todo: TodoItem): Promise<void> {
    const dueDate = new Date(todo.dueDate);
    const timeStr = dueDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const priorityEmoji = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';

    // Flash status bar to get attention
    this.startFlash(todo.title);

    const action = await vscode.window.showWarningMessage(
      `⏰ TODO OVERDUE! ${priorityEmoji} "${todo.title}" was due at ${timeStr}!`,
      { modal: true, detail: `Your todo "${todo.title}" has reached its deadline.\n\nDue: ${timeStr}\nPriority: ${priorityEmoji} ${todo.priority.toUpperCase()}\n${todo.description ? `\nDescription: ${todo.description}` : ''}` },
      'Mark Done ✅',
      'Snooze 15 min ⏰',
      'Dismiss'
    );

    this.stopFlash();

    if (action === 'Mark Done ✅') {
      this.markDoneFromReminder(todo.id);
    } else if (action === 'Snooze 15 min ⏰') {
      this.snoozeTodo(todo.id, 15);
    }
  }

  /**
   * Mark a todo as done from the reminder notification.
   */
  private markDoneFromReminder(todoId: string): void {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) { return; }

    todos[idx].status = 'done';
    todos[idx].completedAt = new Date().toISOString();
    this.store.saveTodos(todos);
    this.treeProvider?.refresh();
    vscode.window.showInformationMessage(`✅ Done: "${todos[idx].title}"`);
  }

  /**
   * Snooze a todo by pushing the due date forward by the given minutes.
   */
  private snoozeTodo(todoId: string, minutes: number): void {
    const todos = this.store.loadTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) { return; }

    const newDue = new Date(Date.now() + minutes * 60 * 1000);
    todos[idx].dueDate = newDue.toISOString();
    todos[idx].reminderFired = false;
    todos[idx].reminderAdvanceFired = false;

    this.store.saveTodos(todos);
    this.treeProvider?.refresh();

    const timeStr = newDue.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    vscode.window.showInformationMessage(
      `⏰ Snoozed: "${todos[idx].title}" — new reminder at ${timeStr}`
    );
  }

  /**
   * Flash the status bar to grab attention for an overdue todo.
   */
  private startFlash(todoTitle: string): void {
    if (!this.statusBarItem) {
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left, 1000
      );
    }

    let visible = true;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');

    this.flashTimer = setInterval(() => {
      if (this.statusBarItem) {
        if (visible) {
          this.statusBarItem.text = `$(bell) ⏰ TODO OVERDUE: ${todoTitle}`;
          this.statusBarItem.show();
        } else {
          this.statusBarItem.text = `$(bell~spin) ⏰ TODO OVERDUE: ${todoTitle}`;
        }
        visible = !visible;
      }
    }, 800);

    this.statusBarItem.text = `$(bell) ⏰ TODO OVERDUE: ${todoTitle}`;
    this.statusBarItem.show();
  }

  /**
   * Stop the status bar flash.
   */
  private stopFlash(): void {
    if (this.flashTimer !== undefined) {
      clearInterval(this.flashTimer);
      this.flashTimer = undefined;
    }
    this.statusBarItem?.hide();
  }
}

import * as vscode from 'vscode';
import { TodoItem, TodoFilter, TodoStatus } from './types';
import { TodoStore } from './todoStore';
import { priorityEmoji, priorityLabel, formatDueDate, isOverdue } from './utils';

/**
 * TreeDataProvider that renders the TODO list in the VS Code sidebar.
 * Supports filtering by status and inline action buttons.
 */
export class TodoTreeProvider implements vscode.TreeDataProvider<TodoTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TodoTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private store: TodoStore;
  private filter: TodoFilter = 'all';

  constructor(store: TodoStore) {
    this.store = store;
  }

  /**
   * Refresh the tree view.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Set the active filter and refresh.
   */
  setFilter(filter: TodoFilter): void {
    this.filter = filter;
    this.refresh();
  }

  getTreeItem(element: TodoTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TodoTreeItem[] {
    const todos = this.store.loadTodos();
    const filtered = this.applyFilter(todos);

    if (filtered.length === 0) {
      const emptyItem = new TodoTreeItem(
        this.filter === 'all'
          ? 'No todos yet — click + to create one'
          : `No ${this.filter} todos`,
        '',
        vscode.TreeItemCollapsibleState.None
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return [emptyItem];
    }

    // Sort: pending first (by priority high>medium>low, then due date), then done, then cancelled
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const statusOrder: Record<string, number> = { pending: 0, done: 1, cancelled: 2 };

    filtered.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) { return statusDiff; }
      if (a.status === 'pending') {
        const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priDiff !== 0) { return priDiff; }
        // Sort by due date: items with due date first, earlier dates first
        if (a.dueDate && b.dueDate) { return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); }
        if (a.dueDate) { return -1; }
        if (b.dueDate) { return 1; }
      }
      return 0;
    });

    return filtered.map(todo => this.createTreeItem(todo));
  }

  private applyFilter(todos: TodoItem[]): TodoItem[] {
    if (this.filter === 'all') { return todos; }
    return todos.filter(t => t.status === this.filter);
  }

  private createTreeItem(todo: TodoItem): TodoTreeItem {
    const statusIcon = this.getStatusIcon(todo.status);
    const priEmoji = priorityEmoji(todo.priority);
    const priLbl = priorityLabel(todo.priority);
    const dueFmt = formatDueDate(todo.dueDate);

    // Build label
    let label = `${statusIcon} ${todo.title}`;

    // Build description: priority + due date
    const descParts: string[] = [];
    descParts.push(`${priEmoji} ${priLbl}`);
    if (dueFmt) {
      const overdueMarker = todo.status === 'pending' && isOverdue(todo.dueDate) ? ' ⚠️' : '';
      descParts.push(`📅 ${dueFmt}${overdueMarker}`);
    }
    const description = descParts.join('    ');

    const item = new TodoTreeItem(
      label,
      todo.id,
      vscode.TreeItemCollapsibleState.None
    );
    item.description = description;
    item.tooltip = this.buildTooltip(todo);
    item.contextValue = `todo-${todo.status}` as const;

    // Icon based on status
    switch (todo.status) {
      case 'pending':
        item.iconPath = new vscode.ThemeIcon(
          'circle-outline',
          isOverdue(todo.dueDate)
            ? new vscode.ThemeColor('errorForeground')
            : undefined
        );
        break;
      case 'done':
        item.iconPath = new vscode.ThemeIcon(
          'check',
          new vscode.ThemeColor('testing.iconPassed')
        );
        break;
      case 'cancelled':
        item.iconPath = new vscode.ThemeIcon(
          'close',
          new vscode.ThemeColor('errorForeground')
        );
        break;
    }

    return item;
  }

  private getStatusIcon(status: TodoStatus): string {
    switch (status) {
      case 'pending': return '⬜';
      case 'done': return '✅';
      case 'cancelled': return '❌';
    }
  }

  private buildTooltip(todo: TodoItem): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportHtml = true;
    md.appendMarkdown(`### ${todo.title}\n\n`);
    if (todo.description) {
      md.appendMarkdown(`${todo.description}\n\n---\n\n`);
    }
    md.appendMarkdown(`**Status:** ${todo.status}\n\n`);
    md.appendMarkdown(`**Priority:** ${priorityEmoji(todo.priority)} ${priorityLabel(todo.priority)}\n\n`);
    if (todo.dueDate) {
      md.appendMarkdown(`**Due:** 📅 ${formatDueDate(todo.dueDate)}\n\n`);
      if (todo.status === 'pending' && isOverdue(todo.dueDate)) {
        md.appendMarkdown(`⚠️ **OVERDUE**\n\n`);
      }
    }
    md.appendMarkdown(`**Created:** ${new Date(todo.createdAt).toLocaleString()}\n\n`);
    if (todo.completedAt) {
      md.appendMarkdown(`**Completed:** ${new Date(todo.completedAt).toLocaleString()}\n\n`);
    }
    if (todo.cancelledAt) {
      md.appendMarkdown(`**Cancelled:** ${new Date(todo.cancelledAt).toLocaleString()}\n\n`);
    }
    return md;
  }
}

/**
 * A single tree item representing a todo entry.
 */
export class TodoTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly todoId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

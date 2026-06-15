import * as vscode from 'vscode';
import { TodoStore } from './todoStore';
import { TodoTreeProvider, TodoTreeItem } from './todoTreeProvider';
import { TodoCommands } from './todoCommands';
import { TodoReminder } from './todoReminder';

/**
 * Extension entry point. Wires up the store, tree view, commands, and reminders.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('[TodoLane] Activating...');

  // --- Core services ---
  const store = new TodoStore(context);

  const treeProvider = new TodoTreeProvider(store);
  const commands = new TodoCommands(store, treeProvider);
  const reminder = new TodoReminder(store);
  reminder.setTreeProvider(treeProvider);

  // --- Register tree view ---
  const treeView = vscode.window.createTreeView('todolane.todoView', {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });

  // --- Register commands ---
  context.subscriptions.push(
    // New todo
    vscode.commands.registerCommand('todolane.newTodo', () => commands.newTodo()),

    // Edit todo (from inline button — receives tree item)
    vscode.commands.registerCommand('todolane.editTodo', (item: TodoTreeItem) => {
      if (item?.todoId) { commands.editTodo(item.todoId); }
    }),

    // Mark done
    vscode.commands.registerCommand('todolane.markDone', (item: TodoTreeItem) => {
      if (item?.todoId) { commands.markDone(item.todoId); }
    }),

    // Cancel todo
    vscode.commands.registerCommand('todolane.cancelTodo', (item: TodoTreeItem) => {
      if (item?.todoId) { commands.cancelTodo(item.todoId); }
    }),

    // Delete todo
    vscode.commands.registerCommand('todolane.deleteTodo', (item: TodoTreeItem) => {
      if (item?.todoId) { commands.deleteTodo(item.todoId); }
    }),

    // Filters
    vscode.commands.registerCommand('todolane.filterAll', () => {
      treeProvider.setFilter('all');
      vscode.window.showInformationMessage('📋 Showing all todos');
    }),
    vscode.commands.registerCommand('todolane.filterPending', () => {
      treeProvider.setFilter('pending');
      vscode.window.showInformationMessage('⬜ Showing pending todos');
    }),
    vscode.commands.registerCommand('todolane.filterDone', () => {
      treeProvider.setFilter('done');
      vscode.window.showInformationMessage('✅ Showing done todos');
    }),
    vscode.commands.registerCommand('todolane.filterCancelled', () => {
      treeProvider.setFilter('cancelled');
      vscode.window.showInformationMessage('❌ Showing cancelled todos');
    }),

    // Disposables
    treeView,
    reminder,
  );

  // --- Start reminder loop ---
  reminder.start();

  // --- Status bar ---
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = '$(checklist) TodoLane';
  statusBar.command = 'todolane.newTodo';
  statusBar.tooltip = 'TodoLane: Click to create a new todo';
  statusBar.show();
  context.subscriptions.push(statusBar);

  console.log('[TodoLane] Activated successfully.');
}

export function deactivate(): void {
  console.log('[TodoLane] Deactivated.');
}

import * as vscode from 'vscode';
import { TodoItem } from './types';

/**
 * Manages persistence of todos using VS Code's official storage API.
 * Uses workspaceState so todos are tied to the current workspace,
 * without creating any visible files or folders in the workspace.
 */
export class TodoStore {
  private context: vscode.ExtensionContext;
  private readonly STORAGE_KEY = 'todolane.todos';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Read all todos from workspace state.
   */
  loadTodos(): TodoItem[] {
    try {
      const todos = this.context.workspaceState.get<TodoItem[]>(this.STORAGE_KEY);
      return todos || [];
    } catch (error) {
      console.error('[TodoLane] Error loading todos:', error);
      return [];
    }
  }

  /**
   * Write all todos to workspace state.
   */
  saveTodos(todos: TodoItem[]): void {
    try {
      this.context.workspaceState.update(this.STORAGE_KEY, todos);
    } catch (error) {
      console.error('[TodoLane] Error saving todos:', error);
      vscode.window.showErrorMessage('TodoLane: Failed to save todos.');
    }
  }
}

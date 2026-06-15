import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { TodoItem, TodosFile } from './types';

/**
 * Manages persistence of todos to .devbookmark/todos.json.
 * Handles reading, writing, and ensuring the storage directory exists.
 * Also auto-adds .devbookmark/ to .gitignore.
 */
export class TodoStore {
  private todosFilePath: string;
  private storageDir: string;

  constructor() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      this.storageDir = path.join(workspaceFolder.uri.fsPath, '.devbookmark');
    } else {
      // Fallback for no-workspace usage — use OS temp-like location inside globalStorage
      this.storageDir = path.join(
        vscode.env.appRoot, '..', '.devbookmark-global'
      );
    }
    this.todosFilePath = path.join(this.storageDir, 'todos.json');
  }

  /**
   * Initialize storage: create directory, ensure .gitignore entry.
   */
  initialize(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.ensureGitignore();
  }

  /**
   * Read all todos from disk.
   */
  loadTodos(): TodoItem[] {
    try {
      if (!fs.existsSync(this.todosFilePath)) {
        return [];
      }
      const raw = fs.readFileSync(this.todosFilePath, 'utf-8');
      const data: TodosFile = JSON.parse(raw);
      return data.todos ?? [];
    } catch (error) {
      console.error('[TodoLane] Error loading todos:', error);
      return [];
    }
  }

  /**
   * Write all todos to disk.
   */
  saveTodos(todos: TodoItem[]): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      const data: TodosFile = { version: 1, todos };
      fs.writeFileSync(
        this.todosFilePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('[TodoLane] Error saving todos:', error);
      vscode.window.showErrorMessage('TodoLane: Failed to save todos.');
    }
  }

  /**
   * Ensure .devbookmark/ is in .gitignore.
   */
  private ensureGitignore(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) { return; }

    const gitignorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');
    const entry = '.devbookmark/';

    try {
      let content = '';
      if (fs.existsSync(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, 'utf-8');
      }

      if (!content.includes(entry)) {
        const newContent =
          content.endsWith('\n') || content === ''
            ? content + entry + '\n'
            : content + '\n' + entry + '\n';
        fs.writeFileSync(gitignorePath, newContent, 'utf-8');
      }
    } catch (error) {
      console.error('[TodoLane] Error updating .gitignore:', error);
    }
  }
}

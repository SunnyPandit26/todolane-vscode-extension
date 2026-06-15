# TodoLane — TODO Manager for VS Code

[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/SunnyPandit26.todolane?style=for-the-badge&label=Installs&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=SunnyPandit26.todolane)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/SunnyPandit26.todolane?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=SunnyPandit26.todolane)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)]()

A powerful, lightweight, and fully local TODO manager built directly into VS Code. Create, track, and manage your tasks with priorities, due dates, descriptions, reminders, and status tracking without ever leaving your editor. Zero dependencies, fully offline, and lightning fast.

## 🚀 Features

### ✅ Full TODO Management
- **Create** todos with title, description (200-word limit), priority, and optional due date/time.
- **Edit** any field — title, description, priority, or due date.
- **Mark Done** — complete with timestamp.
- **Cancel** — mark as cancelled.
- **Delete** — remove permanently (with confirmation).

### 🎯 Priority Levels
| Priority | Indicator |
|----------|-----------|
| High     | 🔴        |
| Medium   | 🟡        |
| Low      | 🟢        |

### 📅 Due Date, Time & Reminders
- Set a specific date and time for each todo.
- Relative display: "Today 5:00 PM", "Tomorrow 3:00 PM".
- Overdue items marked with ⚠️.
- VS Code notification fires automatically when a todo's due time is reached.

### 🔍 Filter & Sort
- Filter by: **All**, **Pending**, **Done**, **Cancelled**.
- Sorted automatically by: status → priority → due date.

## 📸 Screenshots

*(Replace these with actual images or GIFs showing the extension in action)*

- **Sidebar View**: `![Sidebar View](media/sidebar-screenshot.png)`
- **Creating a Todo**: `![Create Todo](media/create-todo.gif)`
- **Reminders in Action**: `![Reminders](media/reminders.png)`

## 💻 Usage

1. Open the **TodoLane** panel in the Activity Bar (sidebar).
2. Click the **+** button or run `TodoLane: New Todo` from the Command Palette.
3. Enter a title, add a description, pick a priority, and optionally set a due date.
4. Manage your todos with the inline action buttons.

## ⚙️ Commands

| Command                  | Description            |
|--------------------------|------------------------|
| `TodoLane: New Todo`     | Create a new todo      |
| `TodoLane: Show All`     | Show all todos         |
| `TodoLane: Show Pending` | Filter pending only    |
| `TodoLane: Show Done`    | Filter done only       |
| `TodoLane: Show Cancelled`| Filter cancelled only  |

## 🏗️ Extension Architecture

- **Storage**: All data is stored locally at `.devbookmark/todos.json` within your workspace. 
- **Privacy**: **Zero network calls**. Fully offline. No external APIs, accounts, or telemetry.
- **Technology**: Built using pure TypeScript and the native VS Code API. Zero external npm dependencies.

## 🛠️ Development Setup

If you'd like to build the extension locally or contribute:

1. Clone the repository:
   ```bash
   git clone https://github.com/SunnyPandit26/todolane-vscode-extension.git
   cd todolane-vscode-extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the project in VS Code:
   ```bash
   code .
   ```
4. Press `F5` to open a new VS Code window with the extension loaded (Extension Development Host).

## 📦 Build Instructions

To compile the TypeScript code and package the extension:

1. Compile the project:
   ```bash
   npm run compile
   ```
2. Package the extension into a `.vsix` file (requires `vsce`):
   ```bash
   npx @vscode/vsce package
   ```
3. Install the `.vsix` locally:
   ```bash
   code --install-extension todolane-1.0.0.vsix
   ```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

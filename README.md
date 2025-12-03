# Navit

A powerful Terminal User Interface (TUI) file explorer built with TypeScript and React (Ink).

```
╔═══════════════════════════════════════════════════════════════╗
║   ███╗   ██╗ █████╗ ██╗   ██╗██╗████████╗                    ║
║   ████╗  ██║██╔══██╗██║   ██║██║╚══██╔══╝                    ║
║   ██╔██╗ ██║███████║██║   ██║██║   ██║                       ║
║   ██║╚██╗██║██╔══██║╚██╗ ██╔╝██║   ██║                       ║
║   ██║ ╚████║██║  ██║ ╚████╔╝ ██║   ██║                       ║
║   ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝                       ║
╚═══════════════════════════════════════════════════════════════╝
```

## Features

- 📁 **Dual-pane interface** - File list on the left, preview on the right
- 🔍 **File preview** - Syntax-highlighted preview of text files
- 🎨 **Customizable themes** - Default, Dark, Light, Dracula, Nord
- 📋 **File operations** - Copy, cut, paste, delete, rename, create
- 🔖 **Bookmarks** - Save and jump to favorite directories
- 🔎 **Search & filter** - Quick filter and recursive search
- 📊 **Git integration** - Branch display and file status indicators
- ⚙️ **Fully configurable** - Icons, colors, keybindings, and more
- 💻 **Cross-platform** - Works on Windows, Linux, and macOS

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/navit.git
cd navit

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build and run
npm run build
npm start
```

### Global Installation

```bash
npm install -g .
navit
```

## Usage

```bash
# Start in current directory
navit

# Start in specific directory
navit /path/to/directory

# Show help
navit --help
```

## Keyboard Shortcuts

### Navigation

| Key | Action |
|-----|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `h` / `Backspace` | Go to parent directory |
| `l` / `Enter` | Open folder / Preview file |
| `o` | Open with system application |
| `g` | Go to bookmark |
| `~` | Go to home directory |
| `Page Down` | Page down |
| `Page Up` | Page up |

### Selection & Clipboard

| Key | Action |
|-----|--------|
| `Space` | Toggle file selection |
| `Ctrl+A` | Select all |
| `Ctrl+C` | Copy selected files |
| `Ctrl+X` | Cut selected files |
| `Ctrl+V` | Paste files |
| `y` | Copy path to clipboard |

### File Operations

| Key | Action |
|-----|--------|
| `n` | Create new file |
| `N` | Create new folder |
| `r` | Rename selected file |
| `Delete` | Delete selected files |

### Search & View

| Key | Action |
|-----|--------|
| `/` | Filter current directory |
| `.` | Toggle hidden files |
| `Ctrl+R` | Refresh directory |

### Other

| Key | Action |
|-----|--------|
| `:` | Command palette |
| `?` | Show help |
| `b` / `g` | Show bookmarks |
| `B` | Add current directory to bookmarks |
| `q` | Quit |

## Command Palette

Press `:` to open the command palette. Available commands:

| Command | Description |
|---------|-------------|
| `:quit` / `:q` | Exit navit |
| `:cd <path>` | Change directory |
| `:mkdir <name>` | Create directory |
| `:touch <name>` | Create file |
| `:rename <name>` | Rename selected file |
| `:bookmark add <name>` | Add bookmark |
| `:bookmark remove <name>` | Remove bookmark |
| `:bookmark list` | List bookmarks |
| `:set icons <mode>` | Set icon mode (nerd/unicode/ascii/none) |
| `:set theme <name>` | Set theme |
| `:set hidden <bool>` | Show/hide hidden files |
| `:open` | Open with system app |
| `:yank` | Copy path to clipboard |
| `:refresh` | Refresh directory |
| `:home` | Go to home directory |
| `:help` | Show help |

## Configuration

Navit stores its configuration in:
- **Windows**: `%APPDATA%\navit\config.json`
- **Linux/macOS**: `~/.config/navit/config.json`

You can also create a `.navit.json` file in any directory for project-specific settings.

### Configuration Options

```json
{
  "icons": "unicode",
  "theme": "default",
  "showHidden": false,
  "exitToCwd": true,
  "confirmDelete": true,
  "columns": ["name", "size", "modified"],
  "preview": {
    "maxFileSize": 1048576,
    "syntaxHighlight": true,
    "showLineNumbers": true
  },
  "keybindings": {
    "up": ["k", "up"],
    "down": ["j", "down"],
    "parent": ["h", "backspace"],
    "open": ["l", "return"]
  },
  "bookmarks": {
    "home": "~",
    "projects": "~/projects"
  }
}
```

### Icon Modes

- `nerd` - Nerd Font icons (requires Nerd Font installed)
- `unicode` - Unicode emoji icons (📁 📄)
- `ascii` - ASCII icons ([D] [F])
- `none` - No icons

### Available Themes

- `default` - Dark theme with blue accents
- `dark` - Dark theme (same as default)
- `light` - Light theme
- `dracula` - Dracula color scheme
- `nord` - Nord color scheme

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **TUI Framework**: Ink (React for CLI)
- **Syntax Highlighting**: cli-highlight
- **Git Integration**: simple-git
- **Configuration**: conf

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

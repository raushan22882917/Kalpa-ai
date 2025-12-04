# Kalpa AI - AI-Powered VS Code Web Editor

<div align="center">

![Kalpa AI Logo](public/logo.png)

**A powerful, browser-based code editor with AI assistance, device integration, and project generation capabilities**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Kiro](https://img.shields.io/badge/Built%20with-Kiro-blue)](https://kiro.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🌟 Overview

Kalpa AI is a next-generation web-based code editor that brings the power of VS Code to your browser, enhanced with cutting-edge AI capabilities. Built entirely with [Kiro AI](https://kiro.ai), this project showcases advanced AI-assisted development, spec-driven architecture, and automated workflows.

### Why Kalpa AI?

- **🌐 Browser-Based**: No installation required - code from anywhere
- **🤖 AI-Powered**: Integrated AI assistance with 5 provider options (OpenAI, Anthropic, Gemini, Groq, Ollama)
- **📱 Device Integration**: Connect and test on real Android/iOS devices
- **🚀 Project Generator**: Describe your idea, get a complete project scaffold
- **💾 Offline-First**: Work without internet, sync when connected
- **🎨 Fully Customizable**: Themes, keybindings, extensions, and more

---

## ✨ Features

### Core Editor Features

#### 🎯 Monaco Editor Integration
- **Syntax highlighting** for 20+ programming languages
- **IntelliSense** with auto-completion
- **Multi-tab editing** with split view support
- **Find & Replace** with regex support
- **Code folding** and minimap
- **Bracket matching** and auto-closing

#### 📁 File System Management
- **Virtual file system** with localStorage persistence
- **File upload/download** capabilities
- **Drag & drop** file support
- **Recent files** tracking
- **File search** across workspace

#### 💻 Integrated Terminal
- **Real terminal** powered by node-pty
- **Multiple terminal instances**
- **Command history** and auto-completion
- **Terminal themes** matching editor
- **Copy/paste** support

### AI-Powered Features

#### 🤖 AI Assistant Extension
- **Conversational coding** - Ask questions, get code
- **Code completion** - AI-powered suggestions
- **Error detection** - Automatic bug finding
- **Fix suggestions** - One-click error fixes
- **Code explanation** - Understand complex code
- **Slash commands** - `/explain`, `/fix`, `/optimize`, `/test`

**Supported AI Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Google Gemini (Gemini 1.5 Pro, Gemini 1.5 Flash)
- Groq (Llama 3, Mixtral)
- Ollama (Local models)

#### 🎨 AI Project Generator
Generate complete projects from natural language descriptions!

**Features:**
- **Technology stack selection** - Choose from 5 complexity levels (Beginner to Ultimate)
- **Natural language input** - Describe your project idea
- **Complete project plans** - Requirements, design, and tasks
- **Step-by-step execution** - Guided implementation
- **Image generation** - AI-generated logos and assets
- **Session management** - Save and resume projects

**Example Stacks:**
- **Beginner**: HTML + CSS + Vanilla JS
- **Intermediate**: React + Node.js + MongoDB
- **Advanced**: Next.js + PostgreSQL + Redis
- **Expert**: Microservices + Kubernetes + GraphQL
- **Ultimate**: Full-stack with AI/ML integration

### Device Integration

#### 📱 Physical Device Testing
Connect real Android and iOS devices to test your applications!

**Android Support (ADB):**
- Device discovery and connection
- Terminal access (adb shell)
- App installation (.apk)
- Log viewing (logcat)
- File system access
- Screen mirroring
- Permission management

**iOS Support (libimobiledevice):**
- Device discovery and connection
- Terminal access
- App installation (.ipa)
- System logs
- File system access
- Screen capture

### Cloud Integration

#### ☁️ Supabase Integration
- **Authentication** - Email/password, OAuth
- **Database** - PostgreSQL with real-time subscriptions
- **Storage** - File uploads and management
- **Edge Functions** - Serverless backend

#### 🔗 GitHub Integration
- **Repository sync** - Push/pull code
- **Commit history** - View and manage commits
- **Branch management** - Create, switch, merge
- **Pull requests** - Create and review

### Progressive Web App (PWA)

- **Installable** - Add to home screen
- **Offline support** - Service worker caching
- **Background sync** - Sync when online
- **Push notifications** - Stay updated
- **Responsive design** - Works on all devices

---

## 🎬 Demo

### Screenshots

#### Main Editor Interface
![Main Editor](docs/screenshots/main-editor.png)

#### AI Project Generator
![Project Generator](docs/screenshots/project-generator.png)

#### Device Integration
![Device Integration](docs/screenshots/device-integration.png)

#### AI Assistant
![AI Assistant](docs/screenshots/ai-assistant.png)

### Live Demo

🔗 **[Try Kalpa AI Live](https://kalpa-ai.vercel.app)** *(Coming Soon)*

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **Python** 3.8+ (for device integration)
- **ADB** (for Android device support)
- **libimobiledevice** (for iOS device support)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/raushan22882917/Kalpa-ai.git
cd Kalpa-ai

# Run the setup script (installs dependencies and configures environment)
chmod +x setup.sh
./setup.sh

# Or manually install
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Provider API Keys (at least one required)
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GROQ_API_KEY=your_groq_key

# Ollama (for local models)
VITE_OLLAMA_BASE_URL=http://localhost:11434

# Firebase (optional - for authentication)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Supabase (optional - for cloud storage)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Device Integration Setup

#### Android (ADB)

```bash
# macOS
brew install android-platform-tools

# Ubuntu/Debian
sudo apt-get install android-tools-adb

# Windows
# Download from https://developer.android.com/studio/releases/platform-tools
```

#### iOS (libimobiledevice)

```bash
# macOS
brew install libimobiledevice
brew install ideviceinstaller

# Ubuntu/Debian
sudo apt-get install libimobiledevice-utils
sudo apt-get install ideviceinstaller
```

---

## 📖 Usage

### Basic Workflow

1. **Open the Editor**
   - Navigate to http://localhost:5173
   - The welcome screen will guide you through initial setup

2. **Create or Open Files**
   - Use File Explorer (left sidebar)
   - Drag & drop files
   - Use Cmd/Ctrl + O to open files

3. **Start Coding**
   - Edit files with full IntelliSense support
   - Use Cmd/Ctrl + S to save
   - Split view with Cmd/Ctrl + \

4. **Use AI Assistant**
   - Click AI icon in activity bar
   - Ask questions or request code
   - Use slash commands: `/explain`, `/fix`, `/optimize`

### AI Project Generator

1. **Open Project Generator**
   - Click "New Project" on welcome screen
   - Or use Command Palette (Cmd/Ctrl + Shift + P) → "Generate Project"

2. **Select Technology Stack**
   - Choose complexity level (Beginner to Ultimate)
   - Review included technologies
   - Or specify custom stack

3. **Select Color Theme**
   - Choose from predefined themes
   - Or create custom color palette
   - Theme will be used for generated assets

4. **Describe Your Project**
   ```
   Example: "Create a task management app with user authentication,
   real-time updates, and mobile support. Users should be able to
   create projects, add tasks, set deadlines, and collaborate with
   team members."
   ```

5. **Review Generated Plan**
   - Requirements document with user stories
   - Design document with architecture
   - Task list with implementation steps

6. **Execute Tasks**
   - Follow step-by-step guidance
   - Run commands in integrated terminal
   - AI generates code for each task

### Device Integration

#### Connect Android Device

1. **Enable USB Debugging** on your Android device
2. **Connect via USB** or wireless ADB
3. **Click Device Icon** in activity bar
4. **Select your device** from the list
5. **Access features**:
   - Terminal: Run shell commands
   - Logs: View logcat output
   - Apps: Install/uninstall apps
   - Files: Browse device storage
   - Screen: Mirror device display

#### Connect iOS Device

1. **Trust your computer** on iOS device
2. **Connect via USB**
3. **Click Device Icon** in activity bar
4. **Select your device** from the list
5. **Access features**:
   - Terminal: Run commands
   - Logs: View system logs
   - Apps: Install/manage apps
   - Files: Access file system
   - Screen: Capture screenshots

### Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Command Palette | Ctrl + Shift + P | Cmd + Shift + P |
| Quick Open | Ctrl + P | Cmd + P |
| Save File | Ctrl + S | Cmd + S |
| Find | Ctrl + F | Cmd + F |
| Replace | Ctrl + H | Cmd + Option + F |
| Toggle Terminal | Ctrl + ` | Cmd + ` |
| Split Editor | Ctrl + \ | Cmd + \ |
| Close Tab | Ctrl + W | Cmd + W |
| New File | Ctrl + N | Cmd + N |
| Settings | Ctrl + , | Cmd + , |

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Monaco Editor for code editing
- Xterm.js for terminal
- Lucide React for icons

**Backend:**
- Node.js with Express
- WebSocket for real-time communication
- node-pty for terminal emulation
- ADB/libimobiledevice for device integration

**AI Integration:**
- OpenAI SDK
- Anthropic SDK
- Google Generative AI
- Groq SDK
- Ollama API

**Testing:**
- Vitest for unit tests
- fast-check for property-based testing
- React Testing Library

### Project Structure

```
Kalpa-ai/
├── .kiro/                      # Kiro configuration
│   ├── hooks/                  # Agent hooks
│   │   ├── test-on-save.json
│   │   ├── lint-check.json
│   │   └── spec-reminder.json
│   ├── specs/                  # Feature specifications
│   │   ├── vscode-web-ai-editor/
│   │   ├── ai-project-generator/
│   │   └── device-terminal-integration/
│   └── steering/               # AI steering documents
│       └── project-standards.json
├── src/
│   ├── components/            # React components
│   │   ├── ActivityBar.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── Terminal.tsx
│   │   ├── AIProjectChat.tsx
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── fileSystemService.ts
│   │   ├── terminalService.ts
│   │   ├── projectGeneratorService.ts
│   │   └── ...
│   ├── extensions/            # VS Code-style extensions
│   │   └── ai-assistant/
│   ├── types/                 # TypeScript definitions
│   ├── utils/                 # Utility functions
│   └── data/                  # Static data
├── server/
│   ├── routes/                # API routes
│   ├── services/              # Backend services
│   │   ├── aiService.ts
│   │   ├── deviceManager.ts
│   │   ├── adbBridge.ts
│   │   └── iosBridge.ts
│   └── middleware/            # Express middleware
├── electron/                  # Electron wrapper (optional)
├── public/                    # Static assets
└── docs/                      # Documentation
```

### Key Design Patterns

- **Service Layer Pattern**: Business logic separated from UI
- **Observer Pattern**: Event-driven communication
- **Strategy Pattern**: Multiple AI provider support
- **Factory Pattern**: Component and service creation
- **Singleton Pattern**: Shared state management

---

## 📚 Documentation

### Core Documentation

- **[Architecture Guide](ARCHITECTURE.md)** - System design and patterns
- **[Quick Start Guide](QUICK_START.md)** - Get up and running fast
- **[Kiro Usage Write-up](KIRO_USAGE_WRITEUP.md)** - How Kiro was used to build this project

### Feature Specifications

Located in `.kiro/specs/`:

- **[VS Code Web Editor Spec](.kiro/specs/vscode-web-ai-editor/)** - Core editor features
- **[AI Project Generator Spec](.kiro/specs/ai-project-generator/)** - Project generation system
- **[Device Integration Spec](.kiro/specs/device-terminal-integration/)** - Mobile device support

### API Documentation

#### File System Service

```typescript
import { fileSystemService } from './services/fileSystemService';

// Create a file
await fileSystemService.createFile('/path/to/file.ts', 'content');

// Read a file
const content = await fileSystemService.readFile('/path/to/file.ts');

// List directory
const files = await fileSystemService.listDirectory('/path/to/dir');

// Delete a file
await fileSystemService.deleteFile('/path/to/file.ts');
```

#### AI Service

```typescript
import { clientAIService } from './services/clientAIService';

// Generate code
const response = await clientAIService.generateCode({
  prompt: 'Create a React component for a todo list',
  provider: 'openai',
  model: 'gpt-4'
});

// Chat completion
const chat = await clientAIService.chat({
  messages: [
    { role: 'user', content: 'Explain async/await in JavaScript' }
  ],
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022'
});
```

#### Project Generator Service

```typescript
import { projectGeneratorService } from './services/projectGeneratorService';

// Generate project plan
const plan = await projectGeneratorService.generateProject({
  prompt: 'E-commerce website with payment integration',
  stack: {
    frontend: 'React',
    backend: 'Node.js',
    database: 'PostgreSQL',
    mobile: 'React Native'
  },
  theme: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899'
  }
});

// Execute task
const result = await projectGeneratorService.executeTask(
  plan.tasks[0],
  plan
);
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/services/fileSystemService.test.ts
```

### Property-Based Testing

This project uses property-based testing with fast-check:

```typescript
import fc from 'fast-check';

describe('fileSystemService', () => {
  it('should handle any valid file path', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string(),
        async (path, content) => {
          await fileSystemService.createFile(path, content);
          const read = await fileSystemService.readFile(path);
          expect(read).toBe(content);
        }
      )
    );
  });
});
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with TypeScript rules

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 🎯 Roadmap

### Version 1.1 (Q1 2025)
- [ ] Real-time collaboration (multiple users)
- [ ] Git integration (clone, commit, push)
- [ ] Extension marketplace
- [ ] Custom themes editor
- [ ] Mobile app (React Native)

### Version 1.2 (Q2 2025)
- [ ] Docker container support
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline integration
- [ ] Code review tools
- [ ] Performance profiling

### Version 2.0 (Q3 2025)
- [ ] Self-hosted option
- [ ] Enterprise features
- [ ] Advanced AI models
- [ ] Plugin system
- [ ] White-label solution

---

## 🐛 Known Issues

- **iOS device support** requires macOS
- **Terminal** may have issues on Windows (use WSL)
- **Large files** (>10MB) may cause performance issues
- **Offline mode** has limited AI functionality

See [Issues](https://github.com/raushan22882917/Kalpa-ai/issues) for full list.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Kalpa AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

### Built With Kiro

This entire project was built using [Kiro AI](https://kiro.ai), showcasing:
- **Spec-driven development** for complex features
- **Agent hooks** for automated testing and quality checks
- **Steering documents** for consistent code generation
- **Vibe coding** for rapid prototyping

See [KIRO_USAGE_WRITEUP.md](KIRO_USAGE_WRITEUP.md) for detailed insights.

### Technologies

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Xterm.js](https://xtermjs.org/) - Terminal emulator
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - Backend framework
- [node-pty](https://github.com/microsoft/node-pty) - Terminal backend

### Inspiration

- [VS Code](https://code.visualstudio.com/) - Editor design
- [GitHub Codespaces](https://github.com/features/codespaces) - Cloud IDE concept
- [Replit](https://replit.com/) - Collaborative coding
- [StackBlitz](https://stackblitz.com/) - Web-based development

---

## 📞 Support

### Get Help

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/raushan22882917/Kalpa-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/raushan22882917/Kalpa-ai/discussions)
- **Email**: support@kalpa-ai.com

### Community

- **Discord**: [Join our server](https://discord.gg/kalpa-ai)
- **Twitter**: [@KalpaAI](https://twitter.com/KalpaAI)
- **Blog**: [blog.kalpa-ai.com](https://blog.kalpa-ai.com)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=raushan22882917/Kalpa-ai&type=Date)](https://star-history.com/#raushan22882917/Kalpa-ai&Date)

---

<div align="center">

**Made with ❤️ using [Kiro AI](https://kiro.ai)**

[⬆ Back to Top](#kalpa-ai---ai-powered-vs-code-web-editor)

</div>

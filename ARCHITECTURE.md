# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │       ProjectWorkspaceManager                       │    │
│  │  - Detects workspace state                          │    │
│  │  - Shows welcome screen                             │    │
│  │  - Manages File System Access API                   │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │       ProjectAnalysisChat                           │    │
│  │  - Mode switching (Existing/New)                    │    │
│  │  - AI integration                                   │    │
│  │  - Command generation                               │    │
│  │  - File creation                                    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│         ┌─────────┴─────────┐                               │
│         ▼                   ▼                               │
│  ┌─────────────┐    ┌──────────────────┐                  │
│  │  Terminal   │    │  File System     │                  │
│  │  Component  │    │  Service         │                  │
│  └──────┬──────┘    └──────────────────┘                  │
│         │                                                    │
└─────────┼────────────────────────────────────────────────┘
          │
          │ WebSocket
          │
┌─────────▼────────────────────────────────────────────────┐
│                  Backend Server (Node.js)                 │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │       Terminal WebSocket Handler                    │  │
│  │  - Manages PTY sessions                             │  │
│  │  - Executes shell commands                          │  │
│  │  - Streams output                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │       AI Service                                    │  │
│  │  - Processes AI requests                            │  │
│  │  - Generates responses                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Workspace Detection Flow

```
User Opens App
     │
     ▼
ProjectWorkspaceManager.checkWorkspace()
     │
     ▼
FileSystemService.exists('/')
     │
     ├─── Yes ──→ FileSystemService.listDirectory('/')
     │                 │
     │                 ▼
     │            Count files
     │                 │
     │                 ▼
     │            Show ProjectAnalysisChat
     │
     └─── No ───→ Show Welcome Screen
                       │
                       ├─── "Open Folder" ──→ File System Access API
                       │                            │
                       │                            ▼
                       │                       Load into FileSystemService
                       │
                       └─── "Create New" ──→ Show ProjectAnalysisChat (New Mode)
```

### 2. Project Creation Flow

```
User enters prompt
     │
     ▼
AI generates project name
     │
     ▼
AI generates setup commands
     │
     ▼
Display commands with UI
     │
     ├─── User clicks "Execute All" ──┐
     │                                  │
     └─── User clicks individual "Run" ┘
                    │
                    ▼
     ┌──────────────────────────┐
     │  For each command:       │
     │  1. Open terminal        │
     │  2. Connect WebSocket    │
     │  3. Send command         │
     │  4. Receive output       │
     │  5. Display in terminal  │
     └──────────────────────────┘
                    │
                    ▼
          All commands complete
                    │
                    ▼
          Show success message
```

### 3. File Creation Flow

```
User confirms project creation
     │
     ▼
Request Downloads folder access
     │
     ▼
User grants permission
     │
     ▼
Create project directory
     │
     ▼
┌────────────────────────────┐
│  For each file:            │
│  1. Generate content       │
│  2. Create file handle     │
│  3. Write content          │
│  4. Add to created list    │
└────────────────────────────┘
     │
     ▼
Display file structure
     │
     ▼
Notify parent component
```

## Component Interactions

### ProjectWorkspaceManager ↔ ProjectAnalysisChat

```typescript
// ProjectWorkspaceManager passes:
{
  fileSystem: FileSystemService,
  onOpenTerminal: () => void,
  onExecuteCommand: (cmd: string) => Promise<void>,
  workspacePath: string,
  theme: 'light' | 'dark'
}

// ProjectAnalysisChat calls back:
onProjectCreated(projectPath, files)
onFileCreated(filePath, content)
```

### ProjectAnalysisChat ↔ TerminalCommandService

```typescript
// ProjectAnalysisChat uses:
terminalCommandService.connect(workspacePath)
terminalCommandService.executeCommand(command)
terminalCommandService.executeCommands(commands)

// TerminalCommandService returns:
{
  success: boolean,
  output?: string,
  error?: string,
  exitCode?: number
}
```

### ProjectAnalysisChat ↔ LocalProjectScaffoldingService

```typescript
// ProjectAnalysisChat calls:
localProjectScaffoldingService.createProject({
  projectName,
  description,
  techStack,
  theme
})

// LocalProjectScaffoldingService returns:
{
  success: boolean,
  projectPath?: string,
  filesCreated?: string[],
  error?: string
}
```

## State Management

### ProjectWorkspaceManager State

```typescript
{
  workspaceInfo: {
    isOpen: boolean,
    path?: string,
    name?: string,
    isEmpty?: boolean,
    fileCount?: number
  },
  isChecking: boolean,
  showChat: boolean
}
```

### ProjectAnalysisChat State

```typescript
{
  messages: ChatMessage[],
  inputValue: string,
  isAnalyzing: boolean,
  isProcessing: boolean,
  analysis: ProjectAnalysis | null,
  selectedStack: TechStack | null,
  selectedTheme: ColorTheme | null,
  uploadedImages: File[],
  isInputExpanded: boolean,
  chatMode: 'existing' | 'new',
  currentProjectPath: string,
  createdFiles: string[]
}
```

### TerminalCommandService State

```typescript
{
  wsConnection: WebSocket | null,
  commandQueue: Command[],
  isProcessing: boolean,
  outputBuffer: string[],
  currentCommandResolve: Function | null
}
```

## API Endpoints

### WebSocket: `/terminal`

**Connect:**
```
ws://localhost:3001/terminal?cwd=/path/to/workspace
```

**Messages:**

Input:
```json
{
  "type": "input",
  "data": "npm install\n"
}
```

Resize:
```json
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

Output:
```
"Installing dependencies...\n"
```

### HTTP: `/api/ai`

**POST /api/ai/complete**
```json
{
  "command": "complete",
  "code": "Generate project name",
  "language": "text",
  "context": "Project generation"
}
```

Response:
```json
{
  "result": "weather-wise-app",
  "error": null
}
```

## File System Structure

### Virtual File System (In-Memory)

```
/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── README.md
```

### Real File System (Downloads)

```
~/Downloads/
└── weather-wise-app/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    │   └── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .gitignore
    └── README.md
```

## Security Considerations

1. **File System Access API**
   - Requires explicit user permission
   - Limited to selected directory
   - No access to system files

2. **WebSocket Connection**
   - Local connection only (localhost)
   - No external access
   - Command execution in sandboxed environment

3. **AI Service**
   - API keys stored in environment variables
   - No sensitive data in prompts
   - Rate limiting on backend

4. **Command Execution**
   - Commands run in user's context
   - No privilege escalation
   - Output sanitization

## Performance Optimization

1. **Virtual File System**
   - In-memory storage for fast access
   - Lazy loading for large directories
   - Efficient tree traversal

2. **WebSocket**
   - Persistent connection
   - Binary data support
   - Automatic reconnection

3. **Command Queue**
   - Sequential execution
   - Timeout handling
   - Error recovery

4. **File Creation**
   - Async operations
   - Batch processing
   - Progress feedback

## Error Handling

### Connection Errors
```typescript
try {
  await terminalCommandService.connect();
} catch (error) {
  // Show user-friendly message
  // Provide fallback options
  // Log for debugging
}
```

### File System Errors
```typescript
try {
  await createProject(config);
} catch (error) {
  // Check permission denied
  // Suggest alternative location
  // Retry mechanism
}
```

### AI Service Errors
```typescript
try {
  const response = await aiService.generate(prompt);
} catch (error) {
  // Fallback to default templates
  // Show error message
  // Allow manual input
}
```

## Testing Strategy

1. **Unit Tests**
   - Individual component logic
   - Service methods
   - Utility functions

2. **Integration Tests**
   - Component interactions
   - Service communication
   - API endpoints

3. **E2E Tests**
   - Complete user flows
   - Browser automation
   - Real file creation

4. **Manual Testing**
   - Test page provided
   - Step-by-step instructions
   - Success criteria checklist

## Deployment Considerations

1. **Browser Compatibility**
   - Check File System Access API support
   - Provide fallback for unsupported browsers
   - Progressive enhancement

2. **Server Requirements**
   - Node.js 16+
   - WebSocket support
   - PTY library for terminal

3. **Environment Configuration**
   - API keys management
   - Port configuration
   - CORS settings

4. **Monitoring**
   - Error tracking
   - Performance metrics
   - User analytics

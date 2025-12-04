/**
 * Project Analysis Chat Component
 * Automatically detects and analyzes the project when opened
 * Shows analysis results in a chat interface
 */

import { useState, useEffect, useRef } from 'react';
import { FileSystemService } from '../services/fileSystemService';
import { ProjectAnalysisService, ProjectAnalysis } from '../services/projectAnalysisService';
import { clientAIService } from '../services/clientAIService';
import { TechStack, ColorTheme } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import { PREDEFINED_THEMES } from '../data/predefinedThemes';

import './ProjectAnalysisChat.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  analysis?: ProjectAnalysis;
  commands?: string[];
  currentCommand?: number;
  isExecuting?: boolean;
}

interface ProjectAnalysisChatProps {
  fileSystem: FileSystemService;
  onClose?: () => void;
  theme?: 'light' | 'dark';
  onOpenTerminal?: () => void;
  onExecuteCommand?: (command: string) => Promise<void>;
  onProjectCreated?: (projectPath: string, files: string[]) => void;
  onFileCreated?: (filePath: string, content: string) => void;
  onOpenProject?: (projectPath: string) => Promise<void>;
  onLoadProjectFiles?: (projectPath: string) => Promise<void>;
  workspacePath?: string;
}

const ProjectAnalysisChat = ({ 
  fileSystem, 
  onClose, 
  theme = 'dark',
  onOpenTerminal,
  onExecuteCommand,
  onProjectCreated,
  onFileCreated,
  onOpenProject,
  onLoadProjectFiles,
  workspacePath 
}: ProjectAnalysisChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [selectedStack, setSelectedStack] = useState<TechStack | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [chatMode, setChatMode] = useState<'existing' | 'new'>('existing');
  const [currentProjectPath, setCurrentProjectPath] = useState<string>('');
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisService = useRef(new ProjectAnalysisService(fileSystem));

  // Auto-analyze project on mount (only in existing mode)
  useEffect(() => {
    if (chatMode === 'existing') {
      analyzeProject();
    }
  }, [chatMode]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Analyzes the project structure
   */
  const analyzeProject = async () => {
    setIsAnalyzing(true);
    
    // Add system message
    const systemMessage: ChatMessage = {
      id: 'system-1',
      role: 'system',
      content: 'Analyzing project structure...',
      timestamp: new Date(),
    };
    setMessages([systemMessage]);

    try {
      const projectAnalysis = await analysisService.current.analyzeProject('/');
      setAnalysis(projectAnalysis);

      // Create analysis message
      let analysisContent = '';
      
      if (projectAnalysis.isBlank) {
        analysisContent = `📋 **Project Analysis Complete**\n\n⚠️ **This project appears to be blank.**\n\nThe project directory is empty or contains only configuration files. You can start by creating new files or importing an existing project.`;
      } else {
        analysisContent = `📋 **Project Analysis Complete**\n\n`;
        
        if (projectAnalysis.projectType) {
          analysisContent += `**Project Type:** ${projectAnalysis.projectType}\n\n`;
        }
        
        if (projectAnalysis.technologies.length > 0) {
          analysisContent += `**Technologies Detected:**\n${projectAnalysis.technologies.map(t => `- ${t}`).join('\n')}\n\n`;
        }
        
        analysisContent += `**Project Structure:**\n`;
        analysisContent += `- Directories: ${projectAnalysis.structure.totalDirectories}\n`;
        analysisContent += `- Files: ${projectAnalysis.structure.totalFiles}\n\n`;
        
        if (Object.keys(projectAnalysis.keyFiles).length > 0) {
          analysisContent += `**Key Files Found:**\n`;
          if (projectAnalysis.keyFiles.packageJson) {
            analysisContent += `- package.json\n`;
          }
          if (projectAnalysis.keyFiles.tsconfig) {
            analysisContent += `- tsconfig.json\n`;
          }
          if (projectAnalysis.keyFiles.readme) {
            analysisContent += `- README.md\n`;
          }
          analysisContent += `\n`;
        }
        
        analysisContent += `I can help you understand, modify, or extend this project. What would you like to know?`;
      }

      const analysisMessage: ChatMessage = {
        id: 'analysis-1',
        role: 'assistant',
        content: analysisContent,
        timestamp: new Date(),
        analysis: projectAnalysis,
      };

      setMessages([analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: 'error-1',
        role: 'assistant',
        content: `❌ **Error analyzing project**\n\n${error instanceof Error ? error.message : 'An unknown error occurred while analyzing the project.'}`,
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Sends a user message and gets AI response
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userPrompt = inputValue;
    setInputValue('');
    setIsProcessing(true);

    try {
      if (chatMode === 'new') {
        // New Project Mode: Generate project setup commands
        await handleNewProjectGeneration(userPrompt);
      } else {
        // Existing Project Mode: Answer questions about the project
        await handleExistingProjectQuery(userPrompt);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Error**\n\n${error instanceof Error ? error.message : 'An error occurred while processing your request.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles new project generation with command execution
   */
  const handleNewProjectGeneration = async (prompt: string) => {
    if (!selectedStack) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Please select a tech stack before creating a new project.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Step 1: Generate project name using AI
    const nameMessage: ChatMessage = {
      id: `name-${Date.now()}`,
      role: 'assistant',
      content: '🤔 Generating unique project name...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, nameMessage]);

    try {
      // Ask AI to generate a unique project name
      const namePrompt = `Based on this project description: "${prompt}", generate a unique, creative, and memorable project name. 
      
Rules:
- Must be lowercase
- Use hyphens for spaces
- 2-4 words maximum
- Should reflect the project purpose
- Be creative and catchy

Respond with ONLY the project name, nothing else. Example format: "weather-wise-app" or "task-master-pro"`;

      const nameResponse = await clientAIService.processRequest({
        command: 'complete',
        code: namePrompt,
        language: 'text',
        context: 'Generate a unique project name',
      });

      const projectName = nameResponse.result
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50) || 'my-app';

      // Step 2: Generate commands using AI
      const commandMessage: ChatMessage = {
        id: `commands-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Project Name:** ${projectName}\n\n🔄 Generating setup commands...`,
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = commandMessage;
        return updated;
      });

      // Ask AI to generate terminal commands
      const commandPrompt = `Generate terminal commands to set up this project:

Project Name: ${projectName}
Description: ${prompt}
Tech Stack: ${selectedStack.name}
- Frontend: ${selectedStack.frontend}
${selectedStack.backend ? `- Backend: ${selectedStack.backend}` : ''}
- Database: ${selectedStack.database}
${selectedStack.mobile ? `- Mobile: ${selectedStack.mobile}` : ''}

Generate a list of terminal commands that will:
1. Create project directory
2. Initialize the project with the specified tech stack
3. Install dependencies
4. Set up basic project structure
5. Initialize git repository

Respond with ONLY the commands, one per line, no explanations or markdown. Example:
mkdir ${projectName}
cd ${projectName}
npm create vite@latest . -- --template react-ts
npm install`;

      const commandResponse = await clientAIService.processRequest({
        command: 'complete',
        code: commandPrompt,
        language: 'bash',
        context: 'Generate project setup commands',
      });

      // Parse commands from AI response
      const commands = commandResponse.result
        .split('\n')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('#') && !cmd.startsWith('//'))
        .slice(0, 20); // Limit to 20 commands for safety

      if (commands.length === 0) {
        throw new Error('AI did not generate any valid commands');
      }

      const finalMessage: ChatMessage = {
        id: `final-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Project Setup Plan Created**\n\n**Project Name:** ${projectName}\n**Tech Stack:** ${selectedStack.name}\n**Description:** ${prompt}\n\n**Commands to execute:**\n${commands.map((cmd, i) => `${i + 1}. \`${cmd}\``).join('\n')}\n\n🚀 Starting automatic execution...`,
        timestamp: new Date(),
        commands,
        currentCommand: 0,
        isExecuting: false,
      };

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = finalMessage;
        return updated;
      });

      // Show location selection UI (don't auto-call picker - needs user gesture)
      // User will click a button to choose location
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Error generating plan**\n\n${error instanceof Error ? error.message : 'Failed to create project plan'}\n\nFalling back to default setup...`,
        timestamp: new Date(),
      };
      
      // Fallback to hardcoded commands if AI fails
      const fallbackName = prompt.split(' ').slice(0, 2).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-app';
      const fallbackCommands = generateSetupCommands(selectedStack, prompt, fallbackName);
      
      errorMessage.commands = fallbackCommands;
      errorMessage.currentCommand = 0;
      errorMessage.isExecuting = false;
      errorMessage.content += `\n\n**Using fallback commands for:** ${fallbackName}`;

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = errorMessage;
        return updated;
      });
    }
  };

  /**
   * Handles existing project queries
   */
  const handleExistingProjectQuery = async (prompt: string) => {
    const projectContext = analysis 
      ? `Project Type: ${analysis.projectType || 'Unknown'}\nTechnologies: ${analysis.technologies.join(', ')}\nTotal Files: ${analysis.structure.totalFiles}`
      : 'Project analysis not available';

    let response;
    try {
      response = await clientAIService.processRequest({
        command: 'explain',
        code: prompt,
        language: 'text',
        context: `User is asking about their project. Project context: ${projectContext}`,
        conversationHistory: messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
      });
    } catch (aiError) {
      response = {
        result: `Based on your project analysis:\n\n${projectContext}\n\nI can help you understand your project structure, but the AI service is currently unavailable. Please check your AI service configuration.`,
        error: aiError instanceof Error ? aiError.message : 'AI service unavailable',
      };
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.result || response.error || 'I apologize, but I could not generate a response.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  /**
   * Generates setup commands based on tech stack
   */
  const generateSetupCommands = (stack: TechStack, description: string, projectName: string): string[] => {
    const commands: string[] = [];
    const dirName = projectName.toLowerCase().replace(/\s+/g, '-') || 'my-app';

    // Create project directory
    commands.push(`mkdir ${dirName}`);
    commands.push(`cd ${dirName}`);

    // Generate commands based on frontend framework
    if (stack.frontend.includes('React')) {
      if (stack.frontend.includes('Vite')) {
        commands.push(`npm create vite@latest . -- --template react-ts`);
        commands.push(`npm install`);
      } else if (stack.frontend.includes('Next.js')) {
        commands.push(`npx create-next-app@latest . --typescript --tailwind --app --no-git`);
      } else {
        commands.push(`npx create-react-app . --template typescript`);
      }
    } else if (stack.frontend.includes('Vue')) {
      commands.push(`npm create vue@latest . -- --typescript --jsx --router --pinia`);
      commands.push(`npm install`);
    } else if (stack.frontend.includes('Angular')) {
      commands.push(`npx @angular/cli@latest new . --routing --style=scss --skip-git`);
    } else if (stack.frontend.includes('Svelte')) {
      commands.push(`npm create svelte@latest . -- --template skeleton --types typescript`);
      commands.push(`npm install`);
    } else if (stack.frontend.includes('HTML')) {
      // Plain HTML/CSS/JS
      commands.push(`echo "<!DOCTYPE html><html><head><title>${projectName}</title></head><body><h1>Welcome to ${projectName}</h1></body></html>" > index.html`);
      commands.push(`touch style.css script.js`);
    }

    // Add backend setup if specified
    if (stack.backend) {
      if (stack.backend.includes('Express')) {
        commands.push(`mkdir -p server/src`);
        commands.push(`cd server`);
        commands.push(`npm init -y`);
        commands.push(`npm install express cors dotenv`);
        commands.push(`npm install -D typescript @types/node @types/express @types/cors ts-node nodemon`);
        commands.push(`npx tsc --init`);
        commands.push(`echo "import express from 'express'; const app = express(); app.listen(3001);" > src/index.ts`);
        commands.push(`cd ..`);
      } else if (stack.backend.includes('FastAPI')) {
        commands.push(`mkdir -p server`);
        commands.push(`cd server`);
        commands.push(`python3 -m venv venv`);
        commands.push(`source venv/bin/activate || .\\venv\\Scripts\\activate`);
        commands.push(`pip install fastapi uvicorn python-dotenv`);
        commands.push(`echo "from fastapi import FastAPI\\napp = FastAPI()\\n@app.get('/')\\ndef read_root():\\n    return {'message': 'Hello World'}" > main.py`);
        commands.push(`cd ..`);
      } else if (stack.backend.includes('Django')) {
        commands.push(`mkdir -p server`);
        commands.push(`cd server`);
        commands.push(`python3 -m venv venv`);
        commands.push(`source venv/bin/activate || .\\venv\\Scripts\\activate`);
        commands.push(`pip install django djangorestframework`);
        commands.push(`django-admin startproject config .`);
        commands.push(`cd ..`);
      }
    }

    // Add README
    commands.push(`echo "# ${projectName}\\n\\n${description}\\n\\n## Tech Stack\\n- Frontend: ${stack.frontend}${stack.backend ? '\\n- Backend: ' + stack.backend : ''}\\n- Database: ${stack.database}" > README.md`);

    // Initialize git
    commands.push(`git init`);
    commands.push(`echo "node_modules/\\n.env\\n*.log\\ndist/\\nbuild/" > .gitignore`);
    commands.push(`git add .`);
    commands.push(`git commit -m "Initial commit: ${description.substring(0, 50)}"`);

    // Add start instructions
    commands.push(`echo "\\n✅ Project setup complete! Run 'npm run dev' to start development."`);

    return commands;
  };

  /**
   * Handles Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles image upload
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setUploadedImages(prev => [...prev, ...imageFiles]);
    }
  };

  /**
   * Removes an uploaded image
   */
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Triggers file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Executes commands one by one sequentially
   * Shows next command only after previous completes
   */
  const executeCommandsSequentially = async (messageId: string, commands: string[], startFrom: number = 0, saveLocation?: string) => {
    if (startFrom >= commands.length) {
      // All commands completed - now auto-open the project
      const completionMessage: ChatMessage = {
        id: `complete-${Date.now()}`,
        role: 'assistant',
        content: `✅ **All Commands Completed!**\n\n🎉 Your project has been set up successfully!\n\n🔄 Opening project in editor...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, completionMessage]);

      // Auto-open project in editor and file manager
      if (currentProjectPath) {
        await openProjectAutomatically(currentProjectPath);
      }
      
      return;
    }

    const currentCommand = commands[startFrom];
    
    // Update message to show current command is executing
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isExecuting: true, currentCommand: startFrom }
        : msg
    ));

    // Show which command is running
    const executingMessage: ChatMessage = {
      id: `exec-${Date.now()}-${startFrom}`,
      role: 'system',
      content: `⚡ **Executing Command ${startFrom + 1}/${commands.length}**\n\n\`${currentCommand}\`\n\nPlease wait...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, executingMessage]);

    try {
      // Send command to terminal
      await sendCommandToTerminal(currentCommand);
      
      // Wait for command to complete (adjust timeout based on command type)
      const timeout = getCommandTimeout(currentCommand);
      await new Promise(resolve => setTimeout(resolve, timeout));

      // Mark this command as complete
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isExecuting: false, currentCommand: startFrom + 1 }
          : msg
      ));

      // Show success for this command
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}-${startFrom}`,
        role: 'system',
        content: `✓ **Command ${startFrom + 1} completed successfully**\n\n\`${currentCommand}\``,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);

      // Track created files from echo commands
      if (currentCommand.includes('echo') && currentCommand.includes('>')) {
        const match = currentCommand.match(/>\s*(.+)$/);
        if (match) {
          const fileName = match[1].trim();
          setCreatedFiles(prev => [...prev, fileName]);
        }
      }

      // Track project path from mkdir command
      if (currentCommand.startsWith('mkdir ')) {
        const dirName = currentCommand.replace('mkdir ', '').trim();
        const path = saveLocation ? `${saveLocation}/${dirName}` : (workspacePath ? `${workspacePath}/${dirName}` : dirName);
        setCurrentProjectPath(path);
      }

      // Wait a bit before next command
      await new Promise(resolve => setTimeout(resolve, 500));

      // Execute next command
      executeCommandsSequentially(messageId, commands, startFrom + 1, saveLocation);
    } catch (error) {
      // Stop execution on error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isExecuting: false }
          : msg
      ));

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ **Error at Command ${startFrom + 1}**\n\n\`${currentCommand}\`\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nExecution stopped. You can:\n1. Fix the issue manually\n2. Click "Continue Execution" to resume from next command`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Get timeout for command based on type
   */
  const getCommandTimeout = (command: string): number => {
    if (command.includes('npm install') || command.includes('yarn install')) {
      return 30000; // 30 seconds for package installation
    } else if (command.includes('npm create') || command.includes('npx create')) {
      return 20000; // 20 seconds for project creation
    } else if (command.includes('git clone')) {
      return 15000; // 15 seconds for git operations
    } else if (command.startsWith('cd ') || command.startsWith('mkdir ')) {
      return 1000; // 1 second for directory operations
    } else if (command.includes('echo')) {
      return 1000; // 1 second for file creation
    } else {
      return 5000; // 5 seconds default
    }
  };



  /**
   * Automatically opens the project in editor, file manager, and runs dev command
   */
  const openProjectAutomatically = async (projectPath: string) => {
    try {
      // Step 1: Show opening message
      const openingMessage: ChatMessage = {
        id: `opening-${Date.now()}`,
        role: 'system',
        content: `📂 **Opening Project**\n\n1. Loading files into editor...\n2. Opening file manager...\n3. Starting development server...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, openingMessage]);

      // Step 2: Load project files into file system
      if (onLoadProjectFiles) {
        await onLoadProjectFiles(projectPath);
      }

      // Step 3: Open project in editor
      if (onOpenProject) {
        await onOpenProject(projectPath);
      }

      // Step 4: Open terminal
      if (onOpenTerminal) {
        onOpenTerminal();
      }

      // Step 5: Auto-run npm run dev command
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for terminal to open
      
      const devCommand = 'npm run dev';
      const runningMessage: ChatMessage = {
        id: `running-${Date.now()}`,
        role: 'system',
        content: `⚡ **Starting Development Server**\n\nRunning: \`${devCommand}\`\n\nYour app will open automatically in the browser...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, runningMessage]);

      // Execute dev command
      if (onExecuteCommand) {
        await onExecuteCommand(devCommand);
      }

      // Step 6: Show success message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Project Opened Successfully!**\n\n📁 **Location:** \`${projectPath}\`\n📝 **Files:** Loaded in editor\n📂 **File Manager:** Open\n⚡ **Dev Server:** Running\n\n🎉 Your development environment is ready!\n\nCheck your browser for the live preview.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);

      // Notify parent
      if (onProjectCreated) {
        onProjectCreated(projectPath, createdFiles);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ **Error opening project**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can manually:\n1. Navigate to: \`${projectPath}\`\n2. Run: \`npm run dev\``,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Sends a command to the terminal for execution
   */
  const sendCommandToTerminal = async (command: string): Promise<void> => {
    // Open terminal if callback provided
    if (onOpenTerminal) {
      onOpenTerminal();
    }
    
    // Execute command if callback provided
    if (onExecuteCommand) {
      try {
        await onExecuteCommand(command);
      } catch (error) {
        console.error(`Failed to execute command: ${command}`, error);
        throw error;
      }
    } else {
      // Fallback: log to console
      console.log(`[Terminal] Executing: ${command}`);
    }
    
    return Promise.resolve();
  };

  return (
    <div className={`project-analysis-chat ${theme}`}>
      <div className="chat-header">
        <div className="header-left">
          <div className="header-title-section">
            <h2>AI Assistant</h2>
            {currentProjectPath && (
              <div className="project-path-display">
                <span className="path-icon">📁</span>
                <span className="path-text" title={currentProjectPath}>{currentProjectPath}</span>
              </div>
            )}
          </div>
          <div className="mode-switch">
            <button
              className={`mode-button ${chatMode === 'existing' ? 'active' : ''}`}
              onClick={() => setChatMode('existing')}
              title="Work with existing project"
            >
              📂 Existing Project
            </button>
            <button
              className={`mode-button ${chatMode === 'new' ? 'active' : ''}`}
              onClick={() => setChatMode('new')}
              title="Create new project"
            >
              ✨ New Project
            </button>
          </div>
        </div>
        <div className="header-actions">
          {chatMode === 'existing' && (
            <button
              className="refresh-button"
              onClick={analyzeProject}
              title="Re-analyze project"
              disabled={isAnalyzing}
            >
              🔄
            </button>
          )}
          {onClose && (
            <button
              className="close-button"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className="messages-container">
          {messages.length === 0 && !isAnalyzing && (
            <div className="empty-state">
              {chatMode === 'existing' ? (
                <>
                  <div className="mode-icon">📂</div>
                  <h3>Existing Project Mode</h3>
                  <p>I'll help you understand and work with your current project.</p>
                  <ul className="mode-features">
                    <li>Analyze project structure and technologies</li>
                    <li>Answer questions about your code</li>
                    <li>Suggest improvements and fixes</li>
                    <li>Help with debugging and refactoring</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="mode-icon">✨</div>
                  <h3>New Project Mode</h3>
                  <p>Let's create something amazing together!</p>
                  <ul className="mode-features">
                    <li>Choose your tech stack and color theme</li>
                    <li>Describe your project idea</li>
                    <li>Generate project structure and code</li>
                    <li>Get started with best practices</li>
                  </ul>
                </>
              )}
            </div>
          )}

          {messages.length === 0 && isAnalyzing && chatMode === 'existing' && (
            <div className="empty-state">
              <div className="loading-spinner"></div>
              <p>Analyzing project structure...</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Assistant'}
                </span>
                <span className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {message.content.split('\n').map((line, idx) => (
                  <div key={idx}>
                    {line.startsWith('**') && line.endsWith('**') ? (
                      <strong>{line.slice(2, -2)}</strong>
                    ) : line.startsWith('- ') ? (
                      <div style={{ marginLeft: '1rem' }}>{line}</div>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>
              
              {message.analysis && !message.analysis.isBlank && (
                <div className="analysis-details">
                  <details>
                    <summary>View Project Structure</summary>
                    <div className="structure-tree">
                      <div className="structure-item">
                        <strong>Directories:</strong> {message.analysis.structure.totalDirectories}
                      </div>
                      <div className="structure-item">
                        <strong>Files:</strong> {message.analysis.structure.totalFiles}
                      </div>
                      {message.analysis.technologies.length > 0 && (
                        <div className="structure-item">
                          <strong>Technologies:</strong>
                          <div className="tech-tags">
                            {message.analysis.technologies.map((tech, idx) => (
                              <span key={idx} className="tech-tag">{tech}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {message.commands && message.commands.length > 0 && (
                <div className="command-execution-panel">
                  <div className="commands-progress">
                    <div className="progress-header">
                      <span className="progress-title">Setup Commands</span>
                      <span className="progress-count">
                        {message.currentCommand || 0} / {message.commands.length} completed
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${((message.currentCommand || 0) / message.commands.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="commands-list">
                    {message.commands.map((cmd, idx) => {
                      const isCompleted = message.currentCommand !== undefined && idx < message.currentCommand;
                      const isExecuting = idx === message.currentCommand && message.isExecuting;
                      const isPending = message.currentCommand === undefined || idx > (message.currentCommand || 0);
                      
                      // Only show completed, current, and next command
                      if (!isCompleted && !isExecuting && idx !== (message.currentCommand || 0)) {
                        return null;
                      }

                      return (
                        <div 
                          key={idx} 
                          className={`command-item ${
                            isCompleted ? 'completed' : 
                            isExecuting ? 'executing' : 
                            'pending'
                          }`}
                        >
                          <span className="command-number">{idx + 1}</span>
                          <code className="command-text">{cmd}</code>
                          <span className="command-status">
                            {isCompleted && '✓'}
                            {isExecuting && '⏳'}
                            {isPending && '⋯'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="execution-controls">
                    {!message.isExecuting && (message.currentCommand === undefined || message.currentCommand === 0) && (
                      <>
                        <div className="location-selection">
                          <p className="location-prompt">📁 Choose where to save the project:</p>
                          <div className="location-buttons">
                            <button
                              className="execute-commands-button choose-location"
                              onClick={async () => {
                                try {
                                  const dirHandle = await (window as any).showDirectoryPicker({
                                    mode: 'readwrite',
                                    startIn: 'downloads',
                                  });
                                  const saveLocation = dirHandle.name;
                                  executeCommandsSequentially(message.id, message.commands!, 0, saveLocation);
                                } catch (error) {
                                  // User cancelled or error - use Downloads
                                  executeCommandsSequentially(message.id, message.commands!, 0, '~/Downloads');
                                }
                              }}
                            >
                              📂 Choose Location
                            </button>
                            <button
                              className="execute-commands-button use-downloads"
                              onClick={() => executeCommandsSequentially(message.id, message.commands!, 0, '~/Downloads')}
                            >
                              ⬇️ Use Downloads Folder
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    {!message.isExecuting && message.currentCommand !== undefined && message.currentCommand > 0 && message.currentCommand < message.commands.length && (
                      <button
                        className="execute-commands-button continue"
                        onClick={() => executeCommandsSequentially(message.id, message.commands!, message.currentCommand)}
                      >
                        ▶ Continue from Command {message.currentCommand + 1}
                      </button>
                    )}
                  </div>

                  {message.currentCommand === message.commands.length && (
                    <div className="execution-complete">
                      ✅ All commands executed successfully!
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {createdFiles.length > 0 && (
          <div className="file-structure-panel">
            <div className="file-structure-header">
              <span className="structure-icon">📂</span>
              <span className="structure-title">Created Files ({createdFiles.length})</span>
            </div>
            <div className="file-structure-list">
              {createdFiles.map((file, idx) => (
                <div key={idx} className="file-structure-item">
                  <span className="file-icon">
                    {file.endsWith('.json') ? '📋' : 
                     file.endsWith('.md') ? '📝' : 
                     file.endsWith('.ts') || file.endsWith('.tsx') ? '📘' : 
                     file.endsWith('.css') ? '🎨' : 
                     file.endsWith('.html') ? '🌐' : '📄'}
                  </span>
                  <span className="file-name">{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`input-container ${isInputExpanded ? 'expanded' : ''} ${chatMode === 'new' ? 'new-project-mode' : ''}`}>
          {chatMode === 'new' && (
            <>
              <div className="input-controls-top">
                <div className="input-dropdowns">
                  <select
                    className="tech-stack-dropdown"
                    value={selectedStack?.id || ''}
                    onChange={(e) => {
                      const stack = PREDEFINED_STACKS.find(s => s.id === e.target.value);
                      setSelectedStack(stack || null);
                    }}
                    disabled={isProcessing || isAnalyzing}
                    title="Choose tech stack"
                  >
                    <option value="">Select Tech Stack</option>
                    {PREDEFINED_STACKS.map(stack => (
                      <option key={stack.id} value={stack.id}>
                        {stack.name} - {stack.frontend}
                      </option>
                    ))}
                  </select>

                  <select
                    className="color-theme-dropdown"
                    value={selectedTheme?.id || ''}
                    onChange={(e) => {
                      const theme = PREDEFINED_THEMES.find(t => t.id === e.target.value);
                      setSelectedTheme(theme || null);
                    }}
                    disabled={isProcessing || isAnalyzing}
                    title="Choose color theme"
                  >
                    <option value="">Select Color Theme</option>
                    {PREDEFINED_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-actions">
                  <button
                    className="expand-button"
                    onClick={() => setIsInputExpanded(!isInputExpanded)}
                    title={isInputExpanded ? "Collapse input area" : "Expand input area"}
                  >
                    {isInputExpanded ? '▼' : '▲'}
                  </button>
                  <button
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing || isAnalyzing}
                    title="Send message (Enter)"
                  >
                    Send
                  </button>
                </div>
              </div>

              {(selectedStack || selectedTheme) && (
                <div className="selection-display">
                  {selectedStack && (
                    <div className="selected-stack-card">
                      <div className="selection-header">
                        <span className="selection-icon">🛠️</span>
                        <span className="selection-label">Tech Stack</span>
                      </div>
                      <div className="selection-content">
                        <h4>{selectedStack.name}</h4>
                        <div className="stack-details">
                          <div className="detail-item">
                            <span className="detail-label">Frontend:</span>
                            <span className="detail-value">{selectedStack.frontend}</span>
                          </div>
                          {selectedStack.backend && (
                            <div className="detail-item">
                              <span className="detail-label">Backend:</span>
                              <span className="detail-value">{selectedStack.backend}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="detail-label">Database:</span>
                            <span className="detail-value">{selectedStack.database}</span>
                          </div>
                          {selectedStack.mobile && (
                            <div className="detail-item">
                              <span className="detail-label">Mobile:</span>
                              <span className="detail-value">{selectedStack.mobile}</span>
                            </div>
                          )}
                        </div>
                        <div className="stack-level">
                          <span className="level-badge">Level {selectedStack.levelNumber}</span>
                          <span className="level-name">{selectedStack.level}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTheme && (
                    <div className="selected-theme-card">
                      <div className="selection-header">
                        <span className="selection-icon">🎨</span>
                        <span className="selection-label">Color Theme</span>
                      </div>
                      <div className="selection-content">
                        <h4>{selectedTheme.name}</h4>
                        <p className="theme-description">{selectedTheme.description}</p>
                        <div className="color-swatches">
                          <div 
                            className="color-swatch" 
                            style={{ backgroundColor: selectedTheme.primary }}
                            title={`Primary: ${selectedTheme.primary}`}
                          >
                            <span className="swatch-label">Primary</span>
                          </div>
                          <div 
                            className="color-swatch" 
                            style={{ backgroundColor: selectedTheme.secondary }}
                            title={`Secondary: ${selectedTheme.secondary}`}
                          >
                            <span className="swatch-label">Secondary</span>
                          </div>
                          <div 
                            className="color-swatch" 
                            style={{ backgroundColor: selectedTheme.accent }}
                            title={`Accent: ${selectedTheme.accent}`}
                          >
                            <span className="swatch-label">Accent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {chatMode === 'existing' && (
            <div className="input-controls-top">
              <div className="input-dropdowns">
                <select
                  className="tech-stack-dropdown"
                  value={selectedStack?.id || ''}
                  onChange={(e) => {
                    const stack = PREDEFINED_STACKS.find(s => s.id === e.target.value);
                    setSelectedStack(stack || null);
                  }}
                  disabled={isProcessing || isAnalyzing}
                  title="Choose tech stack"
                >
                  <option value="">Select Tech Stack</option>
                  {PREDEFINED_STACKS.map(stack => (
                    <option key={stack.id} value={stack.id}>
                      {stack.name} - {stack.frontend}
                    </option>
                  ))}
                </select>

                <select
                  className="color-theme-dropdown"
                  value={selectedTheme?.id || ''}
                  onChange={(e) => {
                    const theme = PREDEFINED_THEMES.find(t => t.id === e.target.value);
                    setSelectedTheme(theme || null);
                  }}
                  disabled={isProcessing || isAnalyzing}
                  title="Choose color theme"
                >
                  <option value="">Select Color Theme</option>
                  {PREDEFINED_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-actions">
                <button
                  className="expand-button"
                  onClick={() => setIsInputExpanded(!isInputExpanded)}
                  title={isInputExpanded ? "Collapse input area" : "Expand input area"}
                >
                  {isInputExpanded ? '▼' : '▲'}
                </button>
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing || isAnalyzing}
                  title="Send message (Enter)"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="uploaded-images-preview">
              {uploadedImages.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Upload ${index + 1}`}
                  />
                  <button
                    className="remove-image-button"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="input-wrapper">
            <div className="mode-indicator">
              {chatMode === 'new' ? '✨ New Project Mode' : '📂 Existing Project Mode'}
            </div>
            <div className="input-row">
              <textarea
                className="message-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  chatMode === 'existing' 
                    ? "Ask about your project..." 
                    : selectedStack 
                      ? "Describe your project (e.g., 'Create a weather app with modern UI')" 
                      : "⚠️ Please select a tech stack first"
                }
                rows={isInputExpanded ? 8 : 1}
                disabled={isProcessing || isAnalyzing || (chatMode === 'new' && !selectedStack)}
              />
              <button
                className="upload-button"
                onClick={handleUploadClick}
                disabled={isProcessing || isAnalyzing}
                title="Upload image"
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalysisChat;


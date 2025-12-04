/**
 * Editor Toolbar Component
 * Provides quick actions like Run, Debug, Format, etc.
 */

import { useState } from 'react';
import './EditorToolbar.css';

interface EditorToolbarProps {
  fileName?: string;
  language?: string;
  lineNumber?: number;
  columnNumber?: number;
  onRun?: () => void;
  isRunning?: boolean;
}

const EditorToolbar = ({
  fileName,
  language = 'plaintext',
  lineNumber = 1,
  columnNumber = 1,
  onRun,
  isRunning = false,
}: EditorToolbarProps) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const getLanguageIcon = (lang: string): string => {
    const icons: Record<string, string> = {
      javascript: '📜',
      typescript: '📘',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      c: '⚙️',
      go: '🐹',
      rust: '🦀',
      ruby: '💎',
      php: '🐘',
      html: '🌐',
      css: '🎨',
      json: '📋',
      markdown: '📝',
      yaml: '📄',
      xml: '📄',
      sql: '🗄️',
      shell: '🐚',
      bash: '🐚',
      powershell: '⚡',
    };
    return icons[lang.toLowerCase()] || '📄';
  };

  const canRun = (lang: string): boolean => {
    const runnableLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'go',
      'rust',
      'ruby',
      'php',
      'shell',
      'bash',
      'powershell',
    ];
    return runnableLanguages.includes(lang.toLowerCase());
  };



  return (
    <div className="editor-toolbar">
      <div className="toolbar-left">
        {/* File Name */}
        {fileName && (
          <div className="toolbar-item file-name">
            <span className="file-icon">📄</span>
            <span className="file-name-text">{fileName}</span>
          </div>
        )}

        {/* Language Indicator */}
        <div 
          className="toolbar-item language-indicator"
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          title="Select Language"
        >
          <span className="language-icon">{getLanguageIcon(language)}</span>
          <span className="language-name">{language}</span>
          <span className="dropdown-arrow">▼</span>
          
          {showLanguageMenu && (
            <div className="language-menu">
              <div className="language-menu-item">JavaScript</div>
              <div className="language-menu-item">TypeScript</div>
              <div className="language-menu-item">Python</div>
              <div className="language-menu-item">Java</div>
              <div className="language-menu-item">C++</div>
              <div className="language-menu-item">Go</div>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-center">
        {/* Run Button */}
        {canRun(language) && onRun && (
          <button
            className={`toolbar-button run-button ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <span className="button-icon spinning">⟳</span>
                <span className="button-text">Running...</span>
              </>
            ) : (
              <>
                <span className="button-icon">▶</span>
                <span className="button-text">Run</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="toolbar-right">
        {/* Cursor Position */}
        <div className="toolbar-item cursor-position" title="Line:Column">
          <span className="position-icon">📍</span>
          <span className="position-text">
            Ln {lineNumber}, Col {columnNumber}
          </span>
        </div>

        {/* Encoding */}
        <div className="toolbar-item encoding" title="File Encoding">
          <span>UTF-8</span>
        </div>

        {/* End of Line */}
        <div className="toolbar-item eol" title="End of Line Sequence">
          <span>LF</span>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;

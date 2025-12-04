/**
 * Sidebar Component
 * Container for different sidebar views (Explorer, Search, etc.)
 */

import FileExplorer from './FileExplorer';
import SearchPanel from './SearchPanel';
import SourceControlPanel from './SourceControlPanel';
import ExtensionsPanel from './ExtensionsPanel';
import SupabasePanel from './SupabasePanel';
import RecentFilesPanel from './RecentFilesPanel';
import DebugPanel from './DebugPanel';
import type { FileSystemService } from '../services/fileSystemService';
import type { ActivityView } from './ActivityBar';
import './Sidebar.css';

export interface SidebarProps {
  activeView: ActivityView;
  fileSystem: FileSystemService;
  onFileClick: (path: string, content: string) => void;
  theme?: 'light' | 'dark';
  workspacePath?: string | null;
  currentFile?: { fileName: string; content: string } | null;
  monacoEditor?: any;
  monaco?: any;
  onWorkspaceChange?: (workspacePath: string | null) => void;
}

const Sidebar = ({
  activeView,
  fileSystem,
  onFileClick,
  theme = 'dark',
  workspacePath,
  currentFile,
  monacoEditor,
  monaco,
  onWorkspaceChange,
}: SidebarProps) => {
  const renderView = () => {
    switch (activeView) {
      case 'explorer':
        return (
          <FileExplorer 
            fileSystem={fileSystem} 
            onFileClick={onFileClick} 
            theme={theme}
            workspacePath={workspacePath}
            currentFile={currentFile}
            monacoEditor={monacoEditor}
            monaco={monaco}
            onWorkspaceChange={onWorkspaceChange}
          />
        );
      case 'search':
        return <SearchPanel theme={theme} />;
      case 'source-control':
        return <SourceControlPanel theme={theme} />;
      case 'extensions':
        return <ExtensionsPanel theme={theme} />;
      case 'supabase':
        return <SupabasePanel theme={theme} />;
      case 'recent':
        return (
          <RecentFilesPanel
            onFileClick={(path) => {
              // Try to load file content from fileSystem
              const content = fileSystem.readFile(path) || '';
              onFileClick(path, content);
            }}
            onFolderClick={(path) => {
              console.log('Open folder:', path);
              // Folder opening logic would go here
            }}
            theme={theme}
          />
        );
      case 'debug':
        return <DebugPanel theme={theme} />;
      default:
        return null;
    }
  };

  return (
    <div className={`sidebar ${theme}`}>
      {renderView()}
    </div>
  );
};

export default Sidebar;

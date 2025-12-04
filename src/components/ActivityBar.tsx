/**
 * Activity Bar Component
 * Left sidebar with icons for different views (like VS Code)
 */

import { 
  FolderOpen, 
  Search, 
  GitBranch, 
  Bug, 
  Puzzle, 
  Zap, 
  Clock, 
  Globe, 
  MessageSquare, 
  Download, 
  User, 
  Settings 
} from 'lucide-react';
import './ActivityBar.css';

export type ActivityView = 'explorer' | 'search' | 'source-control' | 'debug' | 'extensions' | 'recent' | 'chat' | 'preview' | 'supabase';

export interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
  chatVisible: boolean;
  onChatToggle: () => void;
  previewVisible: boolean;
  onPreviewToggle: () => void;
  theme?: 'light' | 'dark';
}

const ActivityBar = ({ activeView, onViewChange, chatVisible, onChatToggle, previewVisible, onPreviewToggle, theme = 'dark' }: ActivityBarProps) => {
  const activities = [
    { id: 'explorer' as ActivityView, Icon: FolderOpen, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'search' as ActivityView, Icon: Search, label: 'Search', shortcut: 'Ctrl+Shift+F' },
    { id: 'source-control' as ActivityView, Icon: GitBranch, label: 'Source Control (GitHub)', shortcut: 'Ctrl+Shift+G' },
    { id: 'debug' as ActivityView, Icon: Bug, label: 'Run and Debug', shortcut: 'Ctrl+Shift+D' },
    { id: 'extensions' as ActivityView, Icon: Puzzle, label: 'Extensions Marketplace', shortcut: 'Ctrl+Shift+X' },
    { id: 'supabase' as ActivityView, Icon: Zap, label: 'Supabase', shortcut: 'Ctrl+Shift+S' },
    { id: 'recent' as ActivityView, Icon: Clock, label: 'Recent Files', shortcut: 'Ctrl+Shift+R' },
  ];

  return (
    <div className={`activity-bar ${theme}`}>
      <div className="activity-bar-items">
        {activities.map((activity) => {
          const IconComponent = activity.Icon;
          return (
            <button
              key={activity.id}
              className={`activity-bar-item ${activeView === activity.id ? 'active' : ''}`}
              onClick={() => onViewChange(activity.id)}
              title={`${activity.label} (${activity.shortcut})`}
            >
              <IconComponent className="activity-icon" size={20} />
            </button>
          );
        })}
      </div>
      <div className="activity-bar-bottom">
        <button 
          className={`activity-bar-item ${previewVisible ? 'active' : ''}`}
          title="Live Preview (Ctrl+Shift+V)"
          onClick={onPreviewToggle}
        >
          <Globe className="activity-icon" size={20} />
        </button>
        <button 
          className={`activity-bar-item ${chatVisible ? 'active' : ''}`}
          title="AI Chat (Ctrl+Shift+A)"
          onClick={onChatToggle}
        >
          <MessageSquare className="activity-icon" size={20} />
        </button>
        <button 
          className="activity-bar-item" 
          title="Install App"
          onClick={() => {
            // Trigger install prompt
            window.dispatchEvent(new Event('show-install-prompt'));
          }}
        >
          <Download className="activity-icon" size={20} />
        </button>
        <button 
          className="activity-bar-item" 
          title="Accounts"
          onClick={() => {
            // Open accounts window
            window.dispatchEvent(new Event('open-accounts-window'));
          }}
        >
          <User className="activity-icon" size={20} />
        </button>
        <button 
          className="activity-bar-item" 
          title="Settings"
          onClick={() => {
            // Open settings window
            window.dispatchEvent(new Event('open-settings-window'));
          }}
        >
          <Settings className="activity-icon" size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;

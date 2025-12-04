/**
 * Source Control Panel Component
 * Git integration and version control with GitHub
 */

import { useState, useEffect } from 'react';
import { githubService, type GitHubRepo, type GitHubCommit } from '../services/githubService';
import { notificationService } from '../services/notificationService';
import './SourceControlPanel.css';

export interface SourceControlPanelProps {
  theme?: 'light' | 'dark';
}

const SourceControlPanel = ({ theme = 'dark' }: SourceControlPanelProps) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Load auto-sync config
    const config = githubService.getAutoSyncConfig();
    setAutoSyncEnabled(config.enabled);

    // Subscribe to connection changes
    const unsubscribe = githubService.onConnectionChange((connected) => {
      setIsAuthenticated(connected);
      if (connected) {
        loadRepos();
        // Load active repo if exists
        const activeRepo = githubService.getActiveRepo();
        if (activeRepo) {
          setSelectedRepo(activeRepo);
          loadCommits(activeRepo);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const authenticated = githubService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      loadRepos();
    }
  };

  const handleAuth = async () => {
    try {
      await githubService.authenticate();
    } catch (error: any) {
      notificationService.error(`Authentication failed: ${error.message}`);
    }
  };

  const handleSignOut = () => {
    githubService.signOut();
    setIsAuthenticated(false);
    setRepos([]);
    setSelectedRepo(null);
    setCommits([]);
  };

  const loadRepos = async () => {
    setLoading(true);
    try {
      const userRepos = await githubService.getUserRepos();
      setRepos(userRepos);
    } catch (error: any) {
      notificationService.error(`Failed to load repositories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCommits = async (repo: GitHubRepo) => {
    setLoading(true);
    try {
      const [owner, repoName] = repo.full_name.split('/');
      const repoCommits = await githubService.getCommits(owner, repoName, repo.default_branch);
      setCommits(repoCommits);
    } catch (error: any) {
      notificationService.error(`Failed to load commits: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    githubService.setActiveRepo(repo);
    loadCommits(repo);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    // Push files with commit message
    const success = await githubService.quickPush(commitMessage);
    if (success) {
      setCommitMessage('');
      if (selectedRepo) {
        loadCommits(selectedRepo);
      }
    }
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    githubService.updateAutoSyncConfig({ enabled: newValue });
    
    if (newValue) {
      notificationService.success('Auto-sync enabled - your code will be automatically pushed to GitHub');
    } else {
      notificationService.info('Auto-sync disabled');
    }
  };

  const handleCreateRepo = async () => {
    const repoName = prompt('Enter repository name:');
    if (!repoName) return;

    setLoading(true);
    try {
      const newRepo = await githubService.createRepo(
        repoName,
        'Created from VS Code Web AI Editor',
        false
      );

      if (newRepo) {
        await loadRepos();
        setSelectedRepo(newRepo);
        githubService.setActiveRepo(newRepo);
      }
    } catch (error: any) {
      notificationService.error(`Failed to create repository: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`source-control-panel ${theme}`}>
        <div className="source-control-header">
          <h3>Source Control</h3>
        </div>
        
        <div className="source-control-content">
          <div className="auth-prompt">
            <div className="github-icon">🐙</div>
            <h4>Connect to GitHub</h4>
            <p>Sign in to access your repositories</p>
            <button className="github-auth-btn" onClick={handleAuth}>
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`source-control-panel ${theme}`}>
      <div className="source-control-header">
        <div className="header-left">
          <h3>Source Control (GitHub)</h3>
          {isAuthenticated && autoSyncEnabled && (
            <span className="sync-badge enabled" title="Auto-sync enabled">
              🔄 Auto-sync ON
            </span>
          )}
        </div>
        <div className="header-right">
          {isAuthenticated && (
            <button
              className="auto-sync-toggle"
              onClick={handleToggleAutoSync}
              title={autoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
            >
              {autoSyncEnabled ? '🔗' : '⛓️‍💥'}
            </button>
          )}
          <button className="sign-out-btn" onClick={handleSignOut} title="Sign out">
            🚪
          </button>
        </div>
      </div>
      
      <div className="source-control-content">
        <div className="repo-selector">
          <label>Your Repository:</label>
          <select 
            value={selectedRepo?.id || ''} 
            onChange={(e) => {
              const repo = repos.find(r => r.id === Number(e.target.value));
              if (repo) handleRepoSelect(repo);
            }}
          >
            <option value="">Select a repository</option>
            {repos.map(repo => (
              <option key={repo.id} value={repo.id}>
                {repo.full_name}
              </option>
            ))}
          </select>
          <button className="refresh-btn" onClick={loadRepos} disabled={loading}>
            🔄
          </button>
          <button className="create-repo-btn" onClick={handleCreateRepo} disabled={loading} title="Create new repository">
            ➕
          </button>
        </div>

        {selectedRepo && (
          <>
            <div className="commit-section">
              <textarea
                className="commit-message-input"
                placeholder="Message (Ctrl+Enter to commit)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    handleCommit();
                  }
                }}
                rows={3}
              />
              <button 
                className="commit-btn" 
                disabled={!commitMessage.trim()}
                onClick={handleCommit}
              >
                ✓ Commit
              </button>
            </div>

            <div className="changes-section">
              <div className="changes-header">
                <span>Recent Commits</span>
                <span className="changes-count">{commits.length}</span>
              </div>
              <div className="changes-list">
                {commits.length === 0 ? (
                  <div className="empty-changes">
                    <p>No commits</p>
                  </div>
                ) : (
                  commits.slice(0, 10).map(commit => (
                    <div key={commit.sha} className="commit-item">
                      <div className="commit-message">{commit.message}</div>
                      <div className="commit-meta">
                        <span className="commit-author">{commit.author}</span>
                        <span className="commit-date">
                          {new Date(commit.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="git-actions">
              <button className="git-action-btn" onClick={() => notificationService.info('Pull coming soon')}>
                <span>↓</span> Pull
              </button>
              <button className="git-action-btn" onClick={() => notificationService.info('Push coming soon')}>
                <span>↑</span> Push
              </button>
              <button className="git-action-btn" onClick={() => window.open(selectedRepo.html_url, '_blank')}>
                <span>🔗</span> Open
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SourceControlPanel;

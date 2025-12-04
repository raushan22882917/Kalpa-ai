/**
 * Supabase Panel Component
 * Manage Supabase integration, database operations, and storage
 */

import { useState, useEffect } from 'react';
import { supabaseService, type SupabaseConfig } from '../services/supabaseService';
import { notificationService } from '../services/notificationService';
import './SupabasePanel.css';

export interface SupabasePanelProps {
  theme?: 'light' | 'dark';
}

const SupabasePanel = ({ theme = 'dark' }: SupabasePanelProps) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    autoConnect: true
  });
  const [view, setView] = useState<'database' | 'storage' | 'auth'>('database');
  const [tableName, setTableName] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsConfigured(supabaseService.isConfigured());
    setIsConnected(supabaseService.isUserConnected());

    // Load existing config
    const existingConfig = supabaseService.getConfig();
    if (existingConfig) {
      setConfig(existingConfig);
    }

    // Subscribe to connection changes
    const unsubscribe = supabaseService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConfigure = () => {
    if (!config.url || !config.anonKey) {
      notificationService.error('Please provide both URL and Anon Key');
      return;
    }

    supabaseService.configure(config);
    setIsConfigured(true);
    setShowConfig(false);
  };

  const handleAutoConnectToggle = () => {
    const newValue = !config.autoConnect;
    setConfig({ ...config, autoConnect: newValue });
    supabaseService.setAutoConnect(newValue);
    
    if (newValue) {
      notificationService.success('Auto-connect enabled');
    } else {
      notificationService.info('Auto-connect disabled');
    }
  };

  const handleConnectClick = () => {
    if (!isConfigured) {
      setShowConfig(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      notificationService.error('Please enter both email and password');
      return;
    }

    setAuthLoading(true);
    try {
      let user;
      if (isSignUp) {
        user = await supabaseService.signUp(authEmail, authPassword);
        if (user) {
          notificationService.success('Account created and connected!');
        }
      } else {
        user = await supabaseService.signIn(authEmail, authPassword);
        if (user) {
          notificationService.success('Connected to Supabase!');
        }
      }

      if (user) {
        setIsConnected(true);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        notificationService.error(isSignUp ? 'Failed to create account' : 'Failed to sign in. Please check your credentials.');
      }
    } catch (error: any) {
      notificationService.error(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setIsConnected(false);
      notificationService.success('Disconnected from Supabase');
    } catch (error: any) {
      notificationService.error('Failed to sign out');
    }
  };

  const handleQuery = async () => {
    if (!tableName) {
      notificationService.error('Please enter a table name');
      return;
    }

    setLoading(true);
    try {
      const results = await supabaseService.query(tableName, {
        limit: 100
      });
      setQueryResult(results);
    } catch (error: any) {
      notificationService.error(`Query failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className={`supabase-panel ${theme}`}>
        <div className="supabase-header">
          <h3>Supabase</h3>
        </div>
        
        <div className="supabase-content">
          <div className="config-prompt">
            <div className="supabase-icon">⚡</div>
            <h4>Connect Your Supabase Project</h4>
            <p>Sign in to access your own Supabase database</p>
            
            {!showConfig ? (
              <button className="config-btn" onClick={() => setShowConfig(true)}>
                Connect My Project
              </button>
            ) : (
              <div className="config-form">
                <div className="info-box">
                  <p>📝 <strong>Your Own Project</strong></p>
                  <p>Each user connects to their own Supabase project. Get your credentials from your Supabase dashboard.</p>
                </div>
                
                <div className="form-group">
                  <label>Your Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xxxxx.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  />
                  <p className="hint">Find this in your Supabase project Settings → API</p>
                </div>
                <div className="form-group">
                  <label>Your Anon Key</label>
                  <input
                    type="password"
                    placeholder="Your anon/public key"
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                  />
                  <p className="hint">Also in Settings → API (anon/public key)</p>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.autoConnect !== false}
                      onChange={(e) => setConfig({ ...config, autoConnect: e.target.checked })}
                    />
                    <span>Auto-connect with Firebase authentication</span>
                  </label>
                  <p className="hint">Automatically sign in to your Supabase when you sign in with Firebase</p>
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => setShowConfig(false)}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleConfigure}>
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`supabase-panel ${theme}`}>
      <div className="supabase-header">
        <div className="header-left">
          <h3>Supabase</h3>
          {isConnected && (
            <span className="connection-badge connected" title="Connected to Supabase">
              ✓ Connected
            </span>
          )}
          {isConfigured && !isConnected && (
            <span className="connection-badge disconnected" title="Not connected">
              ○ Disconnected
            </span>
          )}
        </div>
        <div className="header-right">
          {isConfigured && (
            <button
              className="auto-connect-toggle"
              onClick={handleAutoConnectToggle}
              title={config.autoConnect ? 'Auto-connect enabled' : 'Auto-connect disabled'}
            >
              {config.autoConnect ? '🔗' : '⛓️‍💥'}
            </button>
          )}
          <button 
            className="config-icon-btn" 
            onClick={() => setShowConfig(true)}
            title="Reconfigure"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="supabase-tabs">
        <button
          className={`tab ${view === 'database' ? 'active' : ''}`}
          onClick={() => setView('database')}
        >
          Database
        </button>
        <button
          className={`tab ${view === 'storage' ? 'active' : ''}`}
          onClick={() => setView('storage')}
        >
          Storage
        </button>
        <button
          className={`tab ${view === 'auth' ? 'active' : ''}`}
          onClick={() => setView('auth')}
        >
          Auth
        </button>
      </div>
      
      <div className="supabase-content">
        {view === 'database' && (
          <div className="database-view">
            <div className="query-section">
              <div className="query-input-group">
                <input
                  type="text"
                  placeholder="Table name"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
                <button onClick={handleQuery} disabled={loading}>
                  {loading ? '⏳' : '🔍'} Query
                </button>
              </div>
            </div>

            <div className="results-section">
              {queryResult.length === 0 ? (
                <div className="empty-results">
                  <p>No results</p>
                  <p className="hint">Enter a table name and click Query</p>
                </div>
              ) : (
                <div className="results-table">
                  <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'storage' && (
          <div className="storage-view">
            <div className="empty-view">
              <p>📦 Storage browser coming soon</p>
              <p className="hint">Upload and manage files in Supabase Storage</p>
            </div>
          </div>
        )}

        {view === 'auth' && (
          <div className="auth-view">
            {!isConnected ? (
              <div className="auth-connect-section">
                <div className="auth-connect-content">
                  <div className="auth-icon-large">⚡</div>
                  <h3>Connect with Supabase</h3>
                  <p>Sign in to your Supabase account to access your database and manage authentication</p>
                  <button 
                    className="connect-supabase-btn"
                    onClick={handleConnectClick}
                    disabled={!isConfigured}
                  >
                    {isConfigured ? '🔐 Connect with Supabase' : '⚙️ Configure Supabase First'}
                  </button>
                  {!isConfigured && (
                    <p className="auth-hint">Please configure your Supabase project URL and API key first</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-connected-section">
                <div className="auth-status-card">
                  <div className="auth-status-header">
                    <span className="status-indicator connected">●</span>
                    <span className="status-text">Connected to Supabase</span>
                  </div>
                  <div className="auth-user-info">
                    <p>You are successfully authenticated</p>
                  </div>
                  <button 
                    className="sign-out-btn"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        }}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3>Connect with Supabase</h3>
              <button 
                className="auth-modal-close"
                onClick={() => setShowAuthModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </div>
              <div className="auth-form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>
              <div className="auth-form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>
              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={authLoading}
              >
                {authLoading ? '⏳ Connecting...' : (isSignUp ? '✨ Create Account & Connect' : '🚀 Sign In & Connect')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="config-modal">
          <div className="config-modal-content">
            <h4>Reconfigure Supabase</h4>
            <div className="form-group">
              <label>Project URL</label>
              <input
                type="text"
                placeholder="https://xxxxx.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Anon Key</label>
              <input
                type="password"
                placeholder="Your anon/public key"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.autoConnect !== false}
                  onChange={(e) => setConfig({ ...config, autoConnect: e.target.checked })}
                />
                <span>Auto-connect with Firebase authentication</span>
              </label>
              <p className="hint">When enabled, Supabase will automatically connect when you sign in with Firebase</p>
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setShowConfig(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleConfigure}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabasePanel;

import { useState, useEffect } from 'react';
import EditorShell from './components/EditorShell';
import SettingsPanel from './components/SettingsPanel';
import AccountsPanel from './components/AccountsPanel';
import NotificationContainer from './components/NotificationContainer';
import InstallPrompt from './components/InstallPrompt';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import type { EditorConfig } from './types/editor';
import { configService } from './services/configService';
import { networkService, type NetworkStatus } from './services/networkService';
import { editorStateService } from './services/editorStateService';
import { notificationService } from './services/notificationService';

function App() {
  const [config, setConfig] = useState<EditorConfig>(() => {
    // Initialize configuration on app load
    return configService.initialize();
  });

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getStatus()
  );
  
  // Check if we're in a separate window (Settings or Accounts)
  const [windowType, setWindowType] = useState<'main' | 'settings' | 'accounts'>(() => {
    const hash = window.location.hash;
    if (hash === '#settings') return 'settings';
    if (hash === '#accounts') return 'accounts';
    return 'main';
  });

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkService.subscribe(async (status) => {
      setNetworkStatus(status);
      
      // Update config to reflect offline mode
      setConfig((prevConfig) => {
        if (status === 'offline') {
          return { ...prevConfig, offlineMode: true };
        } else {
          // Check for local changes and sync if configured
          if (editorStateService.hasLocalChanges() && prevConfig.aiBackendUrl) {
            notificationService.info('Checking for local changes to sync...');
            editorStateService.syncToBackend(prevConfig.aiBackendUrl).catch((error) => {
              console.error('Failed to sync local changes:', error);
              notificationService.error('Failed to sync local changes to backend');
            });
          }
          return { ...prevConfig, offlineMode: false };
        }
      });
    });

    // Handle window events for opening Settings and Accounts
    const handleOpenSettings = () => {
      if (window.electron?.openSettingsWindow) {
        window.electron.openSettingsWindow();
      } else {
        setSettingsVisible(true);
      }
    };

    const handleOpenAccounts = () => {
      if (window.electron?.openAccountsWindow) {
        window.electron.openAccountsWindow();
      } else {
        // Open in main window if not in Electron
        setWindowType('accounts');
      }
    };

    window.addEventListener('open-settings-window', handleOpenSettings);
    window.addEventListener('open-accounts-window', handleOpenAccounts);

    // Handle hash changes for window routing
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#settings') setWindowType('settings');
      else if (hash === '#accounts') setWindowType('accounts');
      else setWindowType('main');
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      unsubscribe();
      window.removeEventListener('open-settings-window', handleOpenSettings);
      window.removeEventListener('open-accounts-window', handleOpenAccounts);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleConfigChange = (newConfig: EditorConfig) => {
    setConfig(newConfig);
    configService.saveConfig(newConfig);
  };

  // Render different views based on window type
  if (windowType === 'settings') {
    return (
      <div className="app settings-window">
        <SettingsPanel
          config={config}
          onConfigChange={handleConfigChange}
          visible={true}
          onClose={() => {
            if (window.electron) {
              // Close window in Electron
              window.close();
            } else {
              setWindowType('main');
              window.location.hash = '';
            }
          }}
        />
      </div>
    );
  }

  if (windowType === 'accounts') {
    return (
      <div className="app accounts-window">
        <AccountsPanel theme={config.theme === 'light' ? 'light' : 'dark'} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>📝 VS Code Web AI</h1>
        <div className="header-menu">
          <div className="menu-item" title="File operations">File</div>
          <div className="menu-item" title="Edit operations">Edit</div>
          <div className="menu-item" title="View options">View</div>
          <div className="menu-item" title="Go to...">Go</div>
          <div className="menu-item" title="Run commands">Run</div>
          <div className="menu-item" title="Terminal">Terminal</div>
          <div className="menu-item" title="Help">Help</div>
        </div>
        <div className="header-right">
          {networkStatus === 'offline' && (
            <div className="offline-indicator" title="You are offline. AI features are disabled.">
              📡 Offline
            </div>
          )}
          <UserProfile onSignInClick={() => setAuthModalVisible(true)} />
          <button 
            className="settings-button"
            onClick={() => setSettingsVisible(true)}
            title="Settings (Ctrl+,)"
          >
            ⚙️
          </button>
        </div>
      </div>
      <EditorShell config={config} onConfigChange={handleConfigChange} />
      <SettingsPanel
        config={config}
        onConfigChange={handleConfigChange}
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <NotificationContainer />
      <InstallPrompt theme={config.theme === 'light' ? 'light' : 'dark'} />
      <AuthModal 
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onAuthSuccess={() => {
          // Reload user extensions after successful auth
          notificationService.success('Welcome! Loading your extensions...');
        }}
      />
    </div>
  );
}

export default App;

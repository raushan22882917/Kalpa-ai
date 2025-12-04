import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let settingsWindow = null;
let accountsWindow = null;
let serverProcess;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/logo.png'),
    title: 'VS Code Web AI Editor',
    backgroundColor: '#1e1e1e',
  });

  // Create application menu
  createMenu();

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create Settings window
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/logo.png'),
    title: 'Settings - VS Code Web AI Editor',
    backgroundColor: '#1e1e1e',
  });

  if (process.env.NODE_ENV === 'development') {
    settingsWindow.loadURL('http://localhost:5173/#/settings');
    settingsWindow.webContents.openDevTools();
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'settings',
    });
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Create Accounts window
function createAccountsWindow() {
  if (accountsWindow) {
    accountsWindow.focus();
    return;
  }

  accountsWindow = new BrowserWindow({
    width: 700,
    height: 600,
    minWidth: 500,
    minHeight: 400,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/logo.png'),
    title: 'Accounts - VS Code Web AI Editor',
    backgroundColor: '#1e1e1e',
  });

  if (process.env.NODE_ENV === 'development') {
    accountsWindow.loadURL('http://localhost:5173/#/accounts');
    accountsWindow.webContents.openDevTools();
  } else {
    accountsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'accounts',
    });
  }

  accountsWindow.on('closed', () => {
    accountsWindow = null;
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          },
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          },
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-folder', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          },
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow);
            if (!result.canceled) {
              mainWindow.webContents.send('menu-save-as', result.filePath);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Terminal',
          accelerator: 'Ctrl+`',
          click: () => {
            mainWindow.webContents.send('menu-toggle-terminal');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            mainWindow.webContents.send('menu-show-docs');
          },
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About VS Code Web AI Editor',
              message: 'VS Code Web AI Editor',
              detail: 'Version 0.1.0\n\nA powerful code editor with AI assistance.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Start the backend server
function startServer() {
  const serverScript = path.join(__dirname, '../server/index.ts');
  
  serverProcess = spawn('npx', ['tsx', serverScript], {
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

// Stop the backend server
function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// App lifecycle
app.whenReady().then(() => {
  // Only start backend server in production mode
  // In development, the server is already running via npm run electron:dev
  if (process.env.NODE_ENV !== 'development') {
    startServer();
    // Wait a bit for server to start, then create window
    setTimeout(createWindow, 2000);
  } else {
    // In development, create window immediately
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// Store auth data in memory
let authData = null;

// IPC handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
  });
  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow);
  return result.filePath;
});

// Auth sync handlers
ipcMain.on('sync-auth', (event, data) => {
  authData = data;
  console.log('Auth data synced:', data ? 'User logged in' : 'User logged out');
});

ipcMain.handle('get-auth-data', async () => {
  return authData;
});

// File System Operations
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:readDir', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name)
    }));
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:createDir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:delete', async (event, targetPath) => {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true });
    } else {
      await fs.unlink(targetPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:exists', async (event, targetPath) => {
  try {
    await fs.access(targetPath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('fs:stat', async (event, targetPath) => {
  try {
    const stats = await fs.stat(targetPath);
    return {
      success: true,
      stats: {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        modified: stats.mtime,
        created: stats.birthtime
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window management handlers
ipcMain.handle('open-settings-window', () => {
  createSettingsWindow();
});

ipcMain.handle('open-accounts-window', () => {
  createAccountsWindow();
});

// Get user Downloads directory
ipcMain.handle('get-downloads-directory', async () => {
  const homeDir = os.homedir();
  const platform = process.platform;
  
  let downloadsPath;
  if (platform === 'win32') {
    downloadsPath = path.join(homeDir, 'Downloads');
  } else if (platform === 'darwin') {
    downloadsPath = path.join(homeDir, 'Downloads');
  } else {
    // Linux
    downloadsPath = path.join(homeDir, 'Downloads');
  }
  
  // Ensure directory exists
  try {
    await fs.mkdir(downloadsPath, { recursive: true });
  } catch (error) {
    console.error('Failed to create Downloads directory:', error);
  }
  
  return downloadsPath;
});

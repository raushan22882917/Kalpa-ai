import { useState, useEffect, useCallback } from 'react';
import { FileSystemService, FileNode } from '../services/fileSystemService';
import { nativeFileSystem } from '../services/nativeFileSystemService';
import { notificationService } from '../services/notificationService';
import { recentFilesService } from '../services/recentFilesService';
import './FileExplorer.css';

interface OutlineItem {
  name: string;
  kind: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  children?: OutlineItem[];
}

export interface FileExplorerProps {
  fileSystem: FileSystemService;
  onFileClick: (path: string, content: string) => void;
  theme?: 'light' | 'dark';
  workspacePath?: string | null;
  currentFile?: { fileName: string; content: string } | null;
  monacoEditor?: any;
  monaco?: any;
  onWorkspaceChange?: (workspacePath: string | null) => void;
}

interface TreeNodeProps {
  node: FileNode;
  path: string;
  fileSystem: FileSystemService;
  onFileClick: (path: string, content: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode, path: string) => void;
  level: number;
}

const TreeNode = ({ node, path, fileSystem, onFileClick, onContextMenu, level }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);

  useEffect(() => {
    if (node.type === 'directory' && isExpanded) {
      try {
        const items = fileSystem.listDirectory(path);
        setChildren(items.sort((a, b) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }));
      } catch (error) {
        console.error('Error listing directory:', error);
        setChildren([]);
      }
    }
  }, [node, path, fileSystem, isExpanded]);

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      try {
        const content = fileSystem.readFile(path);
        onFileClick(path, content);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, node, path);
  };

  const icon = node.type === 'directory' 
    ? (isExpanded ? '📂' : '📁')
    : '📄';

  return (
    <div className="tree-node">
      <div
        className={`tree-node-label ${node.type}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="tree-node-icon">{icon}</span>
        <span className="tree-node-name">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && (
        <div className="tree-node-children">
          {children.map((child) => {
            const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
            return (
              <TreeNode
                key={childPath}
                node={child}
                path={childPath}
                fileSystem={fileSystem}
                onFileClick={onFileClick}
                onContextMenu={onContextMenu}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  path: string;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ContextMenu = ({ x, y, node, onClose, onNewFile, onNewFolder, onRename, onDelete }: ContextMenuProps) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {node.type === 'directory' && (
        <>
          <div className="context-menu-item" onClick={onNewFile}>
            New File
          </div>
          <div className="context-menu-item" onClick={onNewFolder}>
            New Folder
          </div>
          <div className="context-menu-divider" />
        </>
      )}
      <div className="context-menu-item" onClick={onRename}>
        Rename
      </div>
      <div className="context-menu-item" onClick={onDelete}>
        Delete
      </div>
    </div>
  );
};

const FileExplorer = ({ 
  fileSystem, 
  onFileClick, 
  theme = 'dark',
  workspacePath,
  currentFile,
  monacoEditor,
  monaco,
  onWorkspaceChange
}: FileExplorerProps) => {
  const [rootChildren, setRootChildren] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
    path: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    explorer: true,
    outline: true,
    timeline: true,
  });
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    try {
      const items = fileSystem.listDirectory('/');
      setRootChildren(items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      console.error('Error loading root directory:', error);
      setRootChildren([]);
    }
  }, [fileSystem, refreshKey]);

  // Load outline from Monaco editor
  useEffect(() => {
    const loadOutline = async () => {
      if (!monacoEditor || !monaco || !currentFile) {
        setOutlineItems([]);
        return;
      }

      try {
        const model = monacoEditor.getModel();
        if (!model) {
          setOutlineItems([]);
          return;
        }

        // Get document symbols using Monaco's document symbol provider
        const providers = monaco.languages.getDocumentSymbolProvider(model.getLanguageId());
        if (!providers || providers.length === 0) {
          setOutlineItems([]);
          return;
        }

        // Use the first provider
        const provider = providers[0];
        const symbols = await provider.provideDocumentSymbols(model, monaco.CancellationToken.None);

        if (symbols && symbols.length > 0) {
          // Convert to outline items
          const items: OutlineItem[] = symbols.map((symbol: any) => ({
            name: symbol.name,
            kind: symbol.kind?.toString() || '0',
            range: symbol.range || symbol.location?.range || {
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 1,
            },
            children: symbol.children?.map((child: any) => ({
              name: child.name,
              kind: child.kind?.toString() || '0',
              range: child.range || child.location?.range || {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
              },
            })),
          }));
          setOutlineItems(items);
        } else {
          // Fallback: try to extract basic structure from the file
          const content = model.getValue();
          const lines = content.split('\n');
          const basicItems: OutlineItem[] = [];
          
          // Simple regex patterns for common structures
          const functionPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/;
          const classPattern = /^(export\s+)?class\s+(\w+)/;
          const constPattern = /^(export\s+)?const\s+(\w+)\s*=/;
          
          lines.forEach((line, index) => {
            const funcMatch = line.match(functionPattern);
            if (funcMatch) {
              basicItems.push({
                name: funcMatch[3] || funcMatch[2],
                kind: '12', // Function
                range: {
                  startLineNumber: index + 1,
                  startColumn: 1,
                  endLineNumber: index + 1,
                  endColumn: line.length,
                },
              });
            }
            
            const classMatch = line.match(classPattern);
            if (classMatch) {
              basicItems.push({
                name: classMatch[2],
                kind: '5', // Class
                range: {
                  startLineNumber: index + 1,
                  startColumn: 1,
                  endLineNumber: index + 1,
                  endColumn: line.length,
                },
              });
            }
          });
          
          setOutlineItems(basicItems);
        }
      } catch (error) {
        console.error('Error loading outline:', error);
        setOutlineItems([]);
      }
    };

    loadOutline();
    
    // Also listen for model changes
    if (monacoEditor) {
      const model = monacoEditor.getModel();
      if (model) {
        const disposable = model.onDidChangeContent(() => {
          loadOutline();
        });
        return () => disposable.dispose();
      }
    }
  }, [monacoEditor, monaco, currentFile?.fileName]);

  const getWorkspaceName = () => {
    if (!workspacePath) return 'No Folder Opened';
    const parts = workspacePath.split(/[/\\]/);
    return parts[parts.length - 1] || workspacePath;
  };

  const toggleSection = (section: 'explorer' | 'outline' | 'timeline') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleOutlineClick = (item: OutlineItem) => {
    if (monacoEditor && item.range) {
      monacoEditor.setPosition({
        lineNumber: item.range.startLineNumber,
        column: item.range.startColumn,
      });
      monacoEditor.revealLineInCenter(item.range.startLineNumber);
    }
  };

  const getSymbolIcon = (kind: string) => {
    // Monaco SymbolKind enum values
    const kindNum = parseInt(kind);
    if (kindNum >= 0 && kindNum <= 25) {
      const icons = ['📄', '📦', '📁', '🔧', '⚙️', '🔌', '🎨', '📝', '📚', '🔍', '📊', '🎯', '🔗', '📌', '📍', '🎪', '🏷️', '📋', '🔖', '📑', '📃', '📗', '📘', '📙', '📕', '📔'];
      return icons[kindNum] || '📄';
    }
    return '📄';
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode, path: string) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      path,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleNewFile = () => {
    if (!contextMenu) return;
    
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const newPath = contextMenu.path === '/' 
          ? `/${fileName}` 
          : `${contextMenu.path}/${fileName}`;
        fileSystem.createFile(newPath, '');
        refresh();
      } catch (error) {
        alert(`Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleNewFolder = () => {
    if (!contextMenu) return;
    
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const newPath = contextMenu.path === '/' 
          ? `/${folderName}` 
          : `${contextMenu.path}/${folderName}`;
        fileSystem.createDirectory(newPath);
        refresh();
      } catch (error) {
        alert(`Error creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleRename = () => {
    if (!contextMenu) return;
    
    const newName = prompt('Enter new name:', contextMenu.node.name);
    if (newName && newName !== contextMenu.node.name) {
      try {
        fileSystem.rename(contextMenu.path, newName);
        refresh();
      } catch (error) {
        alert(`Error renaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${contextMenu.node.name}"?`);
    if (confirmDelete) {
      try {
        fileSystem.delete(contextMenu.path);
        refresh();
      } catch (error) {
        alert(`Error deleting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleOpenFile = async () => {
    try {
      // Use File System Access API to open a file
      const [fileHandle] = await (window as any).showOpenFilePicker({
        multiple: false,
      });
      
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      // Add file to virtual file system
      const fileName = file.name;
      const filePath = `/${fileName}`;
      
      if (fileSystem.exists(filePath)) {
        fileSystem.updateFile(filePath, content);
      } else {
        fileSystem.createFile(filePath, content);
      }
      
      refresh();
      onFileClick(filePath, content);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error opening file:', error);
        alert('Error opening file. Make sure your browser supports the File System Access API.');
      }
    }
  };

  const handleOpenFolder = async () => {
    try {
      // Use native file system service to open workspace
      const result = await nativeFileSystem.openWorkspace();
      
      if (result.success && result.data) {
        // Clear virtual file system first to remove any old/default project files
        fileSystem.clear();
        
        // Notify parent component about workspace change
        if (onWorkspaceChange) {
          onWorkspaceChange(result.data);
        }
        
        notificationService.success(`Opened folder: ${result.data}`);
        
        // Add to recent folders
        recentFilesService.addFolder(result.data);
        
        // Load ALL files from the opened folder into the virtual file system
        try {
          // Recursive function to load all files and directories
          const loadFilesRecursively = async (dirPath: string, basePath: string = '') => {
            const dirEntries = await nativeFileSystem.readDirectory(dirPath);
            if (dirEntries.success && dirEntries.data) {
              for (const entry of dirEntries.data) {
                // Skip hidden files and common ignore patterns (but allow .gitignore, .env, etc.)
                if (entry.name.startsWith('.') && 
                    entry.name !== '.gitignore' && 
                    entry.name !== '.env' && 
                    entry.name !== '.env.example' &&
                    !entry.name.startsWith('.vscode') &&
                    !entry.name.startsWith('.devai')) {
                  continue;
                }
                
                const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
                
                if (entry.type === 'file') {
                  try {
                    const fileResult = await nativeFileSystem.readFile(entry.path);
                    if (fileResult.success && fileResult.data !== undefined) {
                      const virtualPath = `/${relativePath}`;
                      fileSystem.createFile(virtualPath, fileResult.data);
                    }
                  } catch (fileError) {
                    console.warn(`Could not read file ${entry.path}:`, fileError);
                    // Continue with other files
                  }
                } else if (entry.type === 'directory') {
                  const virtualDirPath = `/${relativePath}`;
                  try {
                    fileSystem.createDirectory(virtualDirPath);
                    // Recursively load subdirectories
                    await loadFilesRecursively(entry.path, relativePath);
                  } catch (dirError) {
                    console.warn(`Could not create directory ${virtualDirPath}:`, dirError);
                  }
                }
              }
            }
          };
          
          // Start loading from the root of the opened folder
          await loadFilesRecursively(result.data);
          
          notificationService.info('Folder loaded successfully');
        } catch (loadError) {
          console.warn('Could not load all files from folder:', loadError);
          notificationService.warning('Some files could not be loaded. The folder is still opened.');
        }
        
        refresh();
      } else {
        if (result.error && !result.error.includes('cancelled') && !result.error.includes('AbortError')) {
          notificationService.warning(result.error || 'No folder selected');
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Folder selection cancelled') {
        console.error('Error opening folder:', error);
        notificationService.error('Failed to open folder. Make sure your browser supports folder access or use Electron mode.');
      }
    }
  };

  return (
    <div className={`file-explorer ${theme}`}>
      {/* Workspace Name */}
      <div className="workspace-name">
        <span className="workspace-icon">📁</span>
        <span className="workspace-text" title={workspacePath || 'No folder opened'}>
          {getWorkspaceName()}
        </span>
      </div>

      {/* Explorer Section */}
      <div className="explorer-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('explorer')}
        >
          <span className="section-toggle">
            {expandedSections.explorer ? '▼' : '▶'}
          </span>
          <span className="section-title">EXPLORER</span>
          <div className="header-actions">
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFile();
              }}
              title="Open File"
            >
              📄
            </button>
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFolder();
              }}
              title="Open Folder"
            >
              📁
            </button>
            <button 
              className="refresh-button" 
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
        {expandedSections.explorer && (
          <div className="file-explorer-tree">
            {rootChildren.map((child) => {
              const childPath = `/${child.name}`;
              return (
                <TreeNode
                  key={childPath}
                  node={child}
                  path={childPath}
                  fileSystem={fileSystem}
                  onFileClick={onFileClick}
                  onContextMenu={handleContextMenu}
                  level={0}
                />
              );
            })}
            {rootChildren.length === 0 && (
              <div className="empty-explorer">
                <p>No files or folders</p>
                <p className="hint">Right-click to create files</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outline Section */}
      <div className="outline-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('outline')}
        >
          <span className="section-toggle">
            {expandedSections.outline ? '▼' : '▶'}
          </span>
          <span className="section-title">OUTLINE</span>
        </div>
        {expandedSections.outline && (
          <div className="outline-tree">
            {outlineItems.length > 0 ? (
              outlineItems.map((item, index) => (
                <div key={index} className="outline-item">
                  <div 
                    className="outline-item-label"
                    onClick={() => handleOutlineClick(item)}
                    title={`${item.name} (Line ${item.range.startLineNumber})`}
                  >
                    <span className="outline-icon">{getSymbolIcon(item.kind)}</span>
                    <span className="outline-name">{item.name}</span>
                  </div>
                  {item.children && item.children.length > 0 && (
                    <div className="outline-children">
                      {item.children.map((child, childIndex) => (
                        <div 
                          key={childIndex}
                          className="outline-item outline-item-child"
                          onClick={() => handleOutlineClick(child)}
                          title={`${child.name} (Line ${child.range.startLineNumber})`}
                        >
                          <span className="outline-icon">{getSymbolIcon(child.kind)}</span>
                          <span className="outline-name">{child.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-outline">
                <p>No symbols found</p>
                <p className="hint">Open a file to see outline</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="timeline-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('timeline')}
        >
          <span className="section-toggle">
            {expandedSections.timeline ? '▼' : '▶'}
          </span>
          <span className="section-title">TIMELINE</span>
        </div>
        {expandedSections.timeline && (
          <div className="timeline-tree">
            <div className="empty-timeline">
              <p>No timeline data</p>
              <p className="hint">File history will appear here</p>
            </div>
          </div>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          path={contextMenu.path}
          onClose={closeContextMenu}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default FileExplorer;

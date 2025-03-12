'use client';

import { useState } from 'react';
import { FileInfo, getRecentFiles, loadFileFromServer } from '../../services/file';

export interface FileSelectorProps {
  onFileLoaded: (filePath: string) => void;
  onError: (error: Error) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function FileSelector({ onFileLoaded, onError, isLoading = false, error = null }: FileSelectorProps) {
  const [filePath, setFilePath] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>(getRecentFiles());
  
  // Handle file path change
  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };
  
  // Handle file selection via file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // In a real implementation, we would upload the file to the server
      // For now, we'll just use the file path
      const filePath = file.name;
      setFilePath(filePath);
      handleLoadFile();
    }
  };
  
  // Handle load file button click
  const handleLoadFile = () => {
    if (!filePath.trim()) return;
    
    try {
      loadFileFromServer(filePath)
        .then(() => {
          // Add to recent files
          const newRecentFile: FileInfo = {
            path: filePath,
            name: filePath.split(/[/\\]/).pop() || filePath,
            lastOpened: new Date().toISOString()
          };
          
          // Update recent files
          const updatedRecentFiles = [
            newRecentFile,
            ...recentFiles.filter(f => f.path !== filePath).slice(0, 4)
          ];
          setRecentFiles(updatedRecentFiles);
          
          // Call onFileLoaded callback
          onFileLoaded(filePath);
        })
        .catch((error: Error) => {
          console.error('Error loading file:', error);
          onError(error);
        });
    } catch (error) {
      console.error('Error loading file:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  // Handle recent file click
  const handleRecentFileClick = (filePath: string) => {
    setFilePath(filePath);
    
    // Load the file
    try {
      loadFileFromServer(filePath)
        .then(() => {
          // Update last opened time
          const updatedRecentFiles = recentFiles.map(f => 
            f.path === filePath 
              ? { ...f, lastOpened: new Date().toISOString() } 
              : f
          );
          setRecentFiles(updatedRecentFiles);
          
          // Call onFileLoaded callback
          onFileLoaded(filePath);
        })
        .catch((error: Error) => {
          console.error('Error loading file:', error);
          onError(error);
        });
    } catch (error) {
      console.error('Error loading file:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-md border border-slate-200">
      <h4 className="text-sm font-medium mb-2 text-slate-700">File Selection</h4>
      
      {/* File input */}
      <div className="mb-2">
        <label 
          htmlFor="file-input"
          className="block w-full px-4 py-2 text-sm text-center text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? 'Loading...' : 'Select File'}
        </label>
        <input
          id="file-input"
          type="file"
          accept=".mat,.mf4"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
      </div>
      
      {/* Manual file path input */}
      <div className="mb-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={filePath}
            onChange={handleFilePathChange}
            placeholder="Or enter file path"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
            disabled={isLoading}
          />
          <button
            onClick={handleLoadFile}
            disabled={!filePath.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-medium mb-1 text-slate-600">Recent Files</h5>
          <div className="space-y-1">
            {recentFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleRecentFileClick(file.path)}
                className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded truncate"
                disabled={isLoading}
              >
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
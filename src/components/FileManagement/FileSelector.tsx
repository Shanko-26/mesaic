'use client';

import { useState } from 'react';
import { FileInfo, getRecentFiles, loadFileFromServer } from '../../services/file';

interface FileSelectorProps {
  onFileLoaded?: (filePath: string) => void;
  onError?: (error: Error) => void;
  isLoading?: boolean;
}

export function FileSelector({ onFileLoaded, onError, isLoading = false }: FileSelectorProps) {
  const [filePath, setFilePath] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>(getRecentFiles());
  
  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };
  
  const handleLoadFile = async () => {
    if (!filePath.trim()) return;
    
    try {
      await loadFileFromServer(filePath);
      onFileLoaded?.(filePath);
      
      // Refresh recent files list
      setRecentFiles(getRecentFiles());
      
      // Clear the input
      setFilePath('');
    } catch (error) {
      console.error('Error loading file:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  const handleRecentFileClick = async (recentFile: FileInfo) => {
    try {
      await loadFileFromServer(recentFile.path);
      onFileLoaded?.(recentFile.path);
    } catch (error) {
      console.error('Error loading recent file:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const filePath = file.path; // This works in Electron but not in browser
    
    if (filePath) {
      setFilePath(filePath);
      try {
        await loadFileFromServer(filePath);
        onFileLoaded?.(filePath);
        
        // Refresh recent files list
        setRecentFiles(getRecentFiles());
        
        // Clear the input
        setFilePath('');
      } catch (error) {
        console.error('Error loading uploaded file:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      onError?.(new Error('Could not get file path from the selected file'));
    }
    
    // Reset the file input
    e.target.value = '';
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="file-path" className="text-sm font-medium text-slate-700">
          File Path
        </label>
        <div className="flex space-x-2">
          <input
            id="file-path"
            type="text"
            value={filePath}
            onChange={handleFilePathChange}
            placeholder="Enter file path"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
            disabled={isLoading}
          />
          <button
            onClick={handleLoadFile}
            disabled={!filePath.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Upload File
        </label>
        <div className="flex items-center space-x-2">
          <label 
            htmlFor="file-upload" 
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Browse...
            <input
              id="file-upload"
              type="file"
              accept=".mat,.mf4"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
          <span className="text-sm text-slate-600">
            Supported formats: .mat, .mf4
          </span>
        </div>
      </div>
      
      {recentFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">Recent Files</h3>
          <ul className="space-y-1 max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white p-1">
            {recentFiles.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => handleRecentFileClick(file)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded-md truncate disabled:opacity-50 disabled:cursor-not-allowed text-slate-700"
                  title={file.path}
                >
                  {file.name}
                  <span className="text-xs text-slate-600 ml-2">
                    {new Date(file.lastModified).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
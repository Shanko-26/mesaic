'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedLayout } from './components/EnhancedLayout';
import { loadFileFromServer, getCurrentFile } from './services/file';

// Define the electron window interface
declare global {
  interface Window {
    electron: {
      fileSystem: {
        openFileDialog: (fileTypes: string[]) => Promise<string | null>;
        readFile: (filePath: string) => Promise<{ success: boolean; filePath: string; error?: string }>;
      };
    };
  }
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial file if available
  useEffect(() => {
    const file = getCurrentFile();
    if (file) {
      console.log('Initial file loaded:', file.path);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <EnhancedLayout />
    </div>
  );
};

export default App; 
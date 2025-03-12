import React, { useState } from 'react';
import MainLayout from './components/MainLayout';

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
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const handleFileOpen = async () => {
    try {
      const filePath = await window.electron.fileSystem.openFileDialog(['mat', 'mf4']);
      if (filePath) {
        setCurrentFile(filePath);
        console.log('File opened:', filePath);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <MainLayout 
        currentFile={currentFile} 
        onFileOpen={handleFileOpen} 
      />
    </div>
  );
};

export default App; 
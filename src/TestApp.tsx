import React from 'react';
import TestSignalProcessing from './components/TestSignalProcessing';

/**
 * Test App component for testing the signal processing implementation
 */
const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">MesAIc - AI Signal Processing Test</h1>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <TestSignalProcessing />
      </main>
      
      <footer className="bg-gray-200 p-4 text-center text-gray-600 mt-8">
        <p>MesAIc - AI Signal Processing Test</p>
      </footer>
    </div>
  );
};

export default TestApp; 
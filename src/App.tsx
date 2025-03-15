'use client';

import React from 'react';
import { EnhancedLayout } from './components/EnhancedLayout';

/**
 * Main App component for MesAIc
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedLayout />
    </div>
  );
};

export default App; 
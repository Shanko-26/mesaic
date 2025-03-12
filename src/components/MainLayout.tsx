'use client';

import { useState, useEffect } from 'react';
import { PlotArea } from './Visualization/PlotArea';
import Controls from './Visualization/Controls';
import QueryInput from './Query/QueryInput';
import Results from './Query/Results';
import Session from './Collaboration/Session';
import Annotations from './Collaboration/Annotations';
import { FileSelector } from './FileManagement/FileSelector';
import { FileData, getFileData } from '../services/file';
import { PlotData, generatePlotData, zoomIn, zoomOut, resetZoom } from '../services/visualization';
import { processNaturalLanguageQuery, QueryResult } from '../services/ai';
import { initSocket, joinSession, leaveSession, addAnnotation, deleteAnnotation } from '../services/socket';
import { checkServerHealth } from '../services/api';

export interface Annotation {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
}

export function MainLayout() {
  // File state
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  
  // Visualization state
  const [signals, setSignals] = useState<string[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [plotData, setPlotData] = useState<PlotData | undefined>(undefined);
  const [isPlotLoading, setIsPlotLoading] = useState(false);
  
  // Query state
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [queryError, setQueryError] = useState<string | undefined>(undefined);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  
  // Collaboration state
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  // Server health check
  const [isServerRunning, setIsServerRunning] = useState(false);
  
  // Check server health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isRunning = await checkServerHealth();
        setIsServerRunning(isRunning);
      } catch (error) {
        console.error('Error checking server health:', error);
        setIsServerRunning(false);
      }
    };
    
    checkHealth();
    
    // Check server health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Initialize socket on component mount
  useEffect(() => {
    initSocket();
    
    return () => {
      if (sessionId) {
        leaveSession();
      }
    };
  }, []);
  
  // Handle file loaded
  const handleFileLoaded = (filePath: string) => {
    setIsFileLoading(true);
    setFileError(null);
    
    try {
      const data = getFileData();
      
      if (!data) {
        throw new Error('Failed to get file data');
      }
      
      console.log('File data loaded:', data);
      
      // Filter out time from signals for selection
      const dataSignals = data.signals.filter(s => s !== 'time');
      
      setFileData(data);
      setSignals(dataSignals);
      
      // Select up to 4 signals for initial visualization
      const initialSignals = dataSignals.slice(0, Math.min(4, dataSignals.length));
      setSelectedSignals(initialSignals);
      
      // Generate plot data
      setIsPlotLoading(true);
      const newPlotData = generatePlotData(data, initialSignals);
      setPlotData(newPlotData);
      setIsPlotLoading(false);
    } catch (error) {
      console.error('Error handling file loaded:', error);
      setFileError(`Error loading file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFileLoading(false);
    }
  };
  
  // Handle file error
  const handleFileError = (error: Error) => {
    setFileError(error.message);
  };
  
  // Handle signal toggle
  const handleSignalToggle = (signal: string) => {
    setSelectedSignals(prev => {
      const newSelectedSignals = prev.includes(signal)
        ? prev.filter(s => s !== signal)
        : [...prev, signal];
      
      // Update plot data
      if (fileData) {
        const newPlotData = generatePlotData(fileData, newSelectedSignals);
        setPlotData(newPlotData);
      }
      
      return newSelectedSignals;
    });
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    zoomIn('plot-container');
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    zoomOut('plot-container');
  };
  
  // Handle reset zoom
  const handleResetZoom = () => {
    resetZoom('plot-container');
  };
  
  // Handle query submission
  const handleQuerySubmit = async (queryText: string) => {
    setIsQueryLoading(true);
    setQuery(queryText);
    setAnswer(undefined);
    setQueryError(undefined);
    
    try {
      const result: QueryResult = await processNaturalLanguageQuery(queryText);
      setAnswer(result.answer);
    } catch (error) {
      console.error('Error processing query:', error);
      setQueryError(`Error processing query: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsQueryLoading(false);
    }
  };
  
  // Handle session creation
  const handleCreateSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    
    joinSession(
      newSessionId,
      handleSessionData,
      handleUserJoined,
      handleUserLeft,
      handleAnnotationAdded,
      handleAnnotationUpdated,
      handleAnnotationDeleted
    );
    
    setIsConnected(true);
  };
  
  // Handle session join
  const handleJoinSession = (id: string) => {
    setSessionId(id);
    
    joinSession(
      id,
      handleSessionData,
      handleUserJoined,
      handleUserLeft,
      handleAnnotationAdded,
      handleAnnotationUpdated,
      handleAnnotationDeleted
    );
    
    setIsConnected(true);
  };
  
  // Handle session data
  const handleSessionData = (data: any) => {
    if (data.annotations) {
      setAnnotations(data.annotations);
    }
    
    if (data.activeUsers) {
      setActiveUsers(data.activeUsers);
    }
  };
  
  // Handle user joined
  const handleUserJoined = (userId: string) => {
    setActiveUsers(prev => [...prev, userId]);
  };
  
  // Handle user left
  const handleUserLeft = (userId: string) => {
    setActiveUsers(prev => prev.filter(id => id !== userId));
  };
  
  // Handle annotation added
  const handleAnnotationAdded = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };
  
  // Handle annotation updated
  const handleAnnotationUpdated = (annotation: Annotation) => {
    setAnnotations(prev => 
      prev.map(a => a.id === annotation.id ? annotation : a)
    );
  };
  
  // Handle annotation deleted
  const handleAnnotationDeleted = (annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  };
  
  // Handle add annotation
  const handleAddAnnotation = (text: string) => {
    if (!sessionId || !isConnected) return;
    
    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      userId: 'current-user' // In a real app, this would be the actual user ID
    };
    
    addAnnotation(annotation);
    
    // Optimistically add to local state
    setAnnotations(prev => [...prev, annotation]);
  };
  
  // Handle delete annotation
  const handleDeleteAnnotation = (annotationId: string) => {
    if (!sessionId || !isConnected) return;
    
    deleteAnnotation(annotationId);
    
    // Optimistically remove from local state
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">MesAIc - AI-Driven Measurement Analysis</h1>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white p-4 overflow-y-auto flex flex-col border-r border-slate-200">
          {/* Server status */}
          <div className="mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isServerRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-800">
                Server: {isServerRunning ? 'Running' : 'Not Running'}
              </span>
            </div>
          </div>
          
          {/* File selector */}
          <div className="mb-6 border border-slate-200 rounded-md p-3 bg-slate-50">
            <h2 className="text-lg font-semibold mb-2 text-slate-800">File Management</h2>
            <FileSelector 
              onFileLoaded={handleFileLoaded}
              onError={handleFileError}
              isLoading={isFileLoading}
            />
            {fileError && (
              <div className="mt-2 text-red-500 text-sm">
                {fileError}
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="mb-6 border border-slate-200 rounded-md p-3 bg-slate-50">
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Visualization Controls</h2>
            <Controls 
              signals={signals}
              selectedSignals={selectedSignals}
              onSignalToggle={handleSignalToggle}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleResetZoom}
            />
          </div>
          
          {/* Collaboration */}
          <div className="mt-auto border border-slate-200 rounded-md p-3 bg-slate-50">
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Collaboration</h2>
            <Session 
              sessionId={sessionId}
              onJoinSession={handleJoinSession}
              onCreateSession={handleCreateSession}
              isConnected={isConnected}
              activeUsers={activeUsers}
            />
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col bg-white">
          {/* Visualization */}
          <div className="flex-1 mb-4 min-h-0">
            <h2 className="text-xl font-semibold mb-2 text-slate-800">Visualization</h2>
            <div className="h-[calc(100%-2rem)] border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
              <PlotArea 
                plotData={plotData}
                isLoading={isPlotLoading}
              />
            </div>
          </div>
          
          {/* AI Query */}
          <div className="mb-4 max-h-[300px] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-slate-800">AI Query</h2>
              {(query || answer || queryError) && (
                <button 
                  onClick={() => {
                    setQuery(undefined);
                    setAnswer(undefined);
                    setQueryError(undefined);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Results
                </button>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-md shadow-sm">
              <QueryInput 
                onSubmit={handleQuerySubmit}
                isLoading={isQueryLoading}
              />
              <div className="mt-2">
                <Results 
                  query={query}
                  answer={answer}
                  error={queryError}
                  isLoading={isQueryLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Annotations sidebar */}
        <div className="w-80 bg-slate-800 text-white p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Annotations</h2>
          <Annotations 
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            isConnected={isConnected}
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-800 text-white p-2 text-center text-sm">
        MesAIc - AI-Driven Measurement Analysis Tool &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
} 
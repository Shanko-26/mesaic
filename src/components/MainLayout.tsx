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
import { 
  PlotData, 
  generatePlotData, 
  zoomIn, 
  zoomOut, 
  resetZoom, 
  CursorData,
  updateCursors,
  debugPlotly
} from '../services/visualization';
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
  
  // Cursor state
  const [primaryCursor, setPrimaryCursor] = useState<CursorData>({
    x: 0,
    visible: false,
    color: 'rgba(255, 0, 0, 0.75)',
    label: 'Primary'
  });
  const [diffCursor, setDiffCursor] = useState<CursorData>({
    x: 0,
    visible: false,
    color: 'rgba(0, 0, 255, 0.75)',
    label: 'Diff'
  });
  
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
    console.log(`===== FILE LOADED =====`);
    console.log(`File loaded: ${filePath}`);
    setIsFileLoading(true);
    setFileError(null);
    
    try {
      const data = getFileData();
      
      if (!data) {
        console.error('Failed to get file data');
        throw new Error('Failed to get file data');
      }
      
      console.log('File data loaded:', data);
      console.log('File data structure:', {
        signals: data.signals,
        hasTimeSignal: data.signals.includes('time'),
        signalCount: data.signals.length,
        dataKeys: Object.keys(data.data),
        timeDataType: data.data.time ? typeof data.data.time : 'undefined',
        timeDataLength: data.data.time ? data.data.time.length : 0,
        timeDataRange: data.data.time ? `${data.data.time[0]} to ${data.data.time[data.data.time.length - 1]}` : 'N/A'
      });
      
      // Filter out time from signals for selection
      const dataSignals = data.signals.filter(s => s !== 'time');
      
      setFileData(data);
      setSignals(dataSignals);
      
      // Select up to 4 signals for initial visualization
      const initialSignals = dataSignals.slice(0, Math.min(4, dataSignals.length));
      console.log(`Selected initial signals for visualization:`, initialSignals);
      setSelectedSignals(initialSignals);
      
      // Generate plot data
      setIsPlotLoading(true);
      console.log('Generating initial plot data');
      const newPlotData = generatePlotData(data, initialSignals);
      console.log('Initial plot data generated:', {
        traces: newPlotData.data.length,
        layout: Object.keys(newPlotData.layout),
        config: Object.keys(newPlotData.config)
      });
      setPlotData(newPlotData);
      setIsPlotLoading(false);
      
      // Reset cursors
      console.log('Resetting cursors to default state');
      setPrimaryCursor(prev => ({ ...prev, visible: false, x: 0 }));
      setDiffCursor(prev => ({ ...prev, visible: false, x: 0 }));
    } catch (error) {
      console.error('Error handling file loaded:', error);
      console.log('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setFileError(`Error loading file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFileLoading(false);
      console.log(`===== END FILE LOADED =====`);
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
        const newPlotData = generatePlotData(
          fileData, 
          newSelectedSignals,
          undefined,
          primaryCursor,
          diffCursor
        );
        setPlotData(newPlotData);
      }
      
      return newSelectedSignals;
    });
  };
  
  // Handle cursor move
  const handleCursorMove = (x: number, isPrimary: boolean) => {
    console.log(`===== CURSOR MOVE =====`);
    console.log(`MainLayout: handleCursorMove called with x=${x}, isPrimary=${isPrimary}`);
    console.log('Current cursor states:', {
      primaryCursor: { ...primaryCursor },
      diffCursor: { ...diffCursor }
    });
    
    if (isPrimary) {
      // Update primary cursor
      const updated = { ...primaryCursor, x, visible: true };
      console.log(`Primary cursor will be updated to:`, updated);
      setPrimaryCursor(updated);
      console.log(`Primary cursor updated to x=${x}, visible=true`);
      
      // Update plot data with new cursor position
      if (fileData) {
        try {
          console.log('Attempting to directly update cursor on plot');
          // First directly update the cursor on the plot for immediate feedback
          updateCursors('plot-container', updated, diffCursor)
            .then(() => {
              console.log('Primary cursor updated on plot successfully');
              
              // Then update the plot data for a complete refresh
              console.log('Generating new plot data with updated cursor');
              const newPlotData = generatePlotData(
                fileData,
                selectedSignals,
                undefined,
                updated,
                diffCursor
              );
              console.log('New plot data generated, updating state');
              setPlotData(newPlotData);
            })
            .catch((error) => {
              console.error('Error directly updating primary cursor:', error);
              console.log('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error)
              });
            });
        } catch (error) {
          console.error('Error updating plot after primary cursor move:', error);
          console.log('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        console.log('No file data available, skipping plot update');
      }
    } else {
      // Update diff cursor
      const updated = { ...diffCursor, x, visible: true };
      console.log(`Diff cursor will be updated to:`, updated);
      setDiffCursor(updated);
      console.log(`Diff cursor updated to x=${x}, visible=true`);
      
      // Update plot data with new cursor position
      if (fileData) {
        try {
          console.log('Attempting to directly update cursor on plot');
          // First directly update the cursor on the plot for immediate feedback
          updateCursors('plot-container', primaryCursor, updated)
            .then(() => {
              console.log('Diff cursor updated on plot successfully');
              
              // Then update the plot data for a complete refresh
              console.log('Generating new plot data with updated cursor');
              const newPlotData = generatePlotData(
                fileData,
                selectedSignals,
                undefined,
                primaryCursor,
                updated
              );
              console.log('New plot data generated, updating state');
              setPlotData(newPlotData);
            })
            .catch((error) => {
              console.error('Error directly updating diff cursor:', error);
              console.log('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error)
              });
            });
        } catch (error) {
          console.error('Error updating plot after diff cursor move:', error);
          console.log('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        console.log('No file data available, skipping plot update');
      }
    }
    console.log(`===== END CURSOR MOVE =====`);
  };
  
  // Toggle primary cursor visibility
  const handleTogglePrimaryCursor = () => {
    console.log(`===== TOGGLE PRIMARY CURSOR =====`);
    console.log(`MainLayout: handleTogglePrimaryCursor called`);
    console.log('Current cursor states:', {
      primaryCursor: { ...primaryCursor },
      diffCursor: { ...diffCursor }
    });
    
    // Debug Plotly before toggle
    debugPlotly('plot-container');
    
    // Update primary cursor
    const updated = { ...primaryCursor, visible: !primaryCursor.visible };
    console.log(`Primary cursor visibility will be toggled from ${primaryCursor.visible} to ${updated.visible}`);
    setPrimaryCursor(updated);
    console.log(`Primary cursor visibility toggled to ${updated.visible}`);
    
    // Update plot data with new cursor state
    if (fileData) {
      try {
        console.log('Attempting to directly update cursor on plot');
        // First directly update the cursor on the plot for immediate feedback
        updateCursors('plot-container', updated, diffCursor)
          .then(() => {
            console.log('Primary cursor visibility updated on plot successfully');
            // Debug Plotly after update
            setTimeout(() => {
              debugPlotly('plot-container');
            }, 500);
          })
          .catch(error => {
            console.error('Error directly updating primary cursor visibility:', error);
            console.log('Error details:', {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error)
            });
          });
        
        console.log('Generating new plot data with updated cursor visibility');
        // Then update the plot data for a complete refresh
        const newPlotData = generatePlotData(
          fileData,
          selectedSignals,
          undefined,
          updated,
          diffCursor
        );
        console.log('New plot data generated with updated cursor visibility, updating state');
        setPlotData(newPlotData);
      } catch (error) {
        console.error('Error updating plot after toggling primary cursor:', error);
        console.log('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      console.log('No file data available, skipping plot update');
    }
    console.log(`===== END TOGGLE PRIMARY CURSOR =====`);
  };
  
  // Toggle diff cursor visibility
  const handleToggleDiffCursor = () => {
    console.log(`===== TOGGLE DIFF CURSOR =====`);
    console.log(`MainLayout: handleToggleDiffCursor called`);
    console.log('Current cursor states:', {
      primaryCursor: { ...primaryCursor },
      diffCursor: { ...diffCursor }
    });
    
    // Update diff cursor
    const updated = { ...diffCursor, visible: !diffCursor.visible };
    console.log(`Diff cursor visibility will be toggled from ${diffCursor.visible} to ${updated.visible}`);
    setDiffCursor(updated);
    console.log(`Diff cursor visibility toggled to ${updated.visible}`);
    
    // Update plot data with new cursor state
    if (fileData) {
      try {
        console.log('Attempting to directly update cursor on plot');
        // First directly update the cursor on the plot for immediate feedback
        updateCursors('plot-container', primaryCursor, updated)
          .then(() => console.log('Diff cursor visibility updated on plot successfully'))
          .catch(error => {
            console.error('Error directly updating diff cursor visibility:', error);
            console.log('Error details:', {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error)
            });
          });
        
        console.log('Generating new plot data with updated cursor visibility');
        // Then update the plot data for a complete refresh
        const newPlotData = generatePlotData(
          fileData,
          selectedSignals,
          undefined,
          primaryCursor,
          updated
        );
        console.log('New plot data generated with updated cursor visibility, updating state');
        setPlotData(newPlotData);
      } catch (error) {
        console.error('Error updating plot after toggling diff cursor:', error);
        console.log('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      console.log('No file data available, skipping plot update');
    }
    console.log(`===== END TOGGLE DIFF CURSOR =====`);
  };
  
  // Reset cursors
  const handleResetCursors = () => {
    console.log(`MainLayout: handleResetCursors called`);
    
    // Reset cursor states
    const resetPrimary = { ...primaryCursor, visible: false, x: 0 };
    const resetDiff = { ...diffCursor, visible: false, x: 0 };
    
    setPrimaryCursor(resetPrimary);
    setDiffCursor(resetDiff);
    console.log('Cursors reset to default state');
    
    // Update plot data with reset cursor state
    if (fileData) {
      try {
        // First directly update the cursor on the plot for immediate feedback
        updateCursors('plot-container', resetPrimary, resetDiff)
          .then(() => console.log('Cursors reset on plot'))
          .catch(error => console.error('Error directly resetting cursors:', error));
        
        // Then update the plot data for a complete refresh
        const newPlotData = generatePlotData(
          fileData,
          selectedSignals,
          undefined,
          resetPrimary,
          resetDiff
        );
        setPlotData(newPlotData);
      } catch (error) {
        console.error('Error updating plot after resetting cursors:', error);
      }
    }
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
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">MesAIc</h1>
          <p className="text-sm text-slate-500">AI-Powered Measurement Analysis Tool</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto p-4 h-full">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left Sidebar */}
            <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto">
              {/* File Selection */}
              <FileSelector 
                onFileLoaded={handleFileLoaded} 
                onError={handleFileError}
                isLoading={isFileLoading}
                error={fileError}
              />
              
              {/* Controls */}
              <Controls 
                signals={signals}
                selectedSignals={selectedSignals}
                onSignalToggle={handleSignalToggle}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onReset={handleResetZoom}
                isPrimaryCursorVisible={primaryCursor.visible}
                isDiffCursorVisible={diffCursor.visible}
                onTogglePrimaryCursor={handleTogglePrimaryCursor}
                onToggleDiffCursor={handleToggleDiffCursor}
                onResetCursors={handleResetCursors}
              />
              
              {/* Collaboration */}
              <Session 
                isConnected={isConnected}
                sessionId={sessionId}
                onCreateSession={handleCreateSession}
                onJoinSession={handleJoinSession}
                activeUsers={activeUsers}
              />
            </div>
            
            {/* Main Content Area */}
            <div className="col-span-6 flex flex-col space-y-4 overflow-hidden">
              {/* Plot Area */}
              <div className="flex-1 bg-white rounded-md border border-slate-200 overflow-hidden">
                <PlotArea 
                  plotData={plotData} 
                  isLoading={isPlotLoading}
                  fileData={fileData || undefined}
                  selectedSignals={selectedSignals}
                  primaryCursor={primaryCursor}
                  diffCursor={diffCursor}
                  onCursorMove={handleCursorMove}
                />
              </div>
              
              {/* Query Input */}
              <div className="bg-white rounded-md border border-slate-200 p-4">
                <QueryInput 
                  onSubmit={handleQuerySubmit}
                  isLoading={isQueryLoading}
                  isDisabled={!fileData || !isServerRunning}
                />
              </div>
            </div>
            
            {/* Right Sidebar */}
            <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto">
              {/* Results */}
              <div className="bg-white rounded-md border border-slate-200 p-4 flex-1">
                <Results 
                  query={query}
                  answer={answer}
                  error={queryError}
                  isLoading={isQueryLoading}
                />
              </div>
              
              {/* Annotations */}
              <div className="bg-white rounded-md border border-slate-200 p-4 flex-1">
                <Annotations 
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-2">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} MesAIc
            </p>
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isServerRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <p className="text-xs text-slate-500">
                {isServerRunning ? 'Server Connected' : 'Server Disconnected'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 
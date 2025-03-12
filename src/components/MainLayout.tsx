'use client';

import { useState, useEffect } from 'react';
import { PlotArea } from './Visualization/PlotArea';
import Controls from './Visualization/Controls';
import QueryInput from './Query/QueryInput';
import Results from './Query/Results';
import SuggestedQueries from './Query/SuggestedQueries';
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
import { processNaturalLanguageQuery, QueryResult, QueryContext } from '../services/ai';
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
  
  // Add a state for metadata
  const [queryMetadata, setQueryMetadata] = useState<any>(undefined);
  
  // UI state for responsive layout
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'plot' | 'query'>('plot');
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'annotations'>('chat');
  
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
    setQueryMetadata(undefined);
    
    try {
      // Create context object with current visualization state
      const queryContext = {
        selectedSignals,
        primaryCursor: primaryCursor.visible ? primaryCursor : undefined,
        diffCursor: diffCursor.visible ? diffCursor : undefined,
        // Add time range if available from the plot data
        timeRange: plotData?.layout?.xaxis?.range as [number, number] | undefined
      };
      
      console.log('Submitting query with context:', {
        query: queryText,
        context: queryContext
      });
      
      const result: QueryResult = await processNaturalLanguageQuery(queryText, queryContext);
      
      setAnswer(result.answer);
      setQueryMetadata(result.metadata);
      
      // If the result includes a visualization suggestion, update the plot
      if (result.metadata?.visualizationSuggestion && fileData) {
        console.log('Received visualization suggestion from AI:', result.metadata.visualizationSuggestion);
        setPlotData(result.metadata.visualizationSuggestion);
      }
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
  
  // Handle toggle left panel
  const handleToggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };
  
  // Handle toggle right panel
  const handleToggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
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
      <header className="bg-white border-b border-slate-200 p-2 md:p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">MesAIc</h1>
              <p className="text-xs md:text-sm text-slate-500">AI-Powered Measurement Analysis Tool</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveTab('plot')}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'plot' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
              >
                Plot
              </button>
              <button 
                onClick={() => setActiveTab('query')}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'query' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
              >
                AI Query
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Sidebar - Collapsible */}
          <div className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${leftPanelCollapsed ? 'w-10' : 'w-64 md:w-80'}`}>
            {/* Toggle button */}
            <button 
              onClick={handleToggleLeftPanel}
              className="p-2 text-slate-500 hover:text-slate-700 self-end"
            >
              {leftPanelCollapsed ? '→' : '←'}
            </button>
            
            {!leftPanelCollapsed && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* File Selection */}
                <FileSelector 
                  onFileLoaded={handleFileLoaded} 
                  onError={handleFileError}
                  isLoading={isFileLoading}
                  error={fileError}
                />
                
                {/* Signal Selection */}
                <div className="bg-white rounded-md border border-slate-200 p-4">
                  <h3 className="text-sm font-medium mb-3 text-slate-800">Signals</h3>
                  <div className="max-h-48 overflow-y-auto pr-1">
                    {signals.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No signals available. Please load a file.</p>
                    ) : (
                      signals.map(signal => (
                        <div key={signal} className="flex items-center mb-2 hover:bg-slate-50 rounded p-1">
                          <input
                            type="checkbox"
                            id={`signal-${signal}`}
                            checked={selectedSignals.includes(signal)}
                            onChange={() => handleSignalToggle(signal)}
                            className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={`signal-${signal}`} 
                            className={`text-sm cursor-pointer ${selectedSignals.includes(signal) ? 'font-medium text-blue-700' : 'text-slate-700'}`}
                          >
                            {signal}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {signals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between">
                      <button 
                        onClick={() => setSelectedSignals([])} 
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Clear All
                      </button>
                      <button 
                        onClick={() => setSelectedSignals([...signals])} 
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Collaboration */}
                <Session 
                  isConnected={isConnected}
                  sessionId={sessionId}
                  onCreateSession={handleCreateSession}
                  onJoinSession={handleJoinSession}
                  activeUsers={activeUsers}
                />
              </div>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Plot Area with Toolbar */}
            <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="bg-white rounded-t-md border border-b-0 border-slate-200 p-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-1 border-r border-slate-200 pr-2">
                    <button 
                      onClick={handleZoomIn}
                      className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      title="Zoom In"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleZoomOut}
                      className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      title="Zoom Out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleResetZoom}
                      className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      title="Reset Zoom"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Cursor Controls */}
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={handleTogglePrimaryCursor}
                      className={`p-1 rounded ${primaryCursor.visible ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                      title="Toggle Primary Cursor"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleToggleDiffCursor}
                      className={`p-1 rounded ${diffCursor.visible ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                      title="Toggle Diff Cursor"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleResetCursors}
                      className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      title="Reset Cursors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Cursor Instructions */}
                <div className="text-xs text-slate-500">
                  Click to position primary cursor • Shift+Click for diff cursor
                </div>
              </div>
              
              {/* Plot */}
              <div className="flex-1 bg-white rounded-b-md border border-slate-200 overflow-hidden">
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
            </div>
          </div>
          
          {/* Right Sidebar - Collapsible */}
          <div className={`flex flex-col border-l border-slate-200 bg-white transition-all duration-300 ${rightPanelCollapsed ? 'w-10' : 'w-72 md:w-96'}`}>
            {/* Toggle button */}
            <button 
              onClick={handleToggleRightPanel}
              className="p-2 text-slate-500 hover:text-slate-700 self-start"
            >
              {rightPanelCollapsed ? '←' : '→'}
            </button>
            
            {!rightPanelCollapsed && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs for Chat and Annotations */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setRightPanelTab('chat')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      rightPanelTab === 'chat'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    AI Chat
                  </button>
                  <button
                    onClick={() => setRightPanelTab('annotations')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      rightPanelTab === 'annotations'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Annotations
                  </button>
                </div>
                
                {/* Content based on selected tab */}
                <div className="flex-1 overflow-y-auto">
                  {rightPanelTab === 'chat' && (
                    <div className="flex flex-col h-full">
                      {/* Chat Results Area */}
                      <div className="flex-1 p-3 overflow-y-auto">
                        <Results 
                          query={query}
                          answer={answer}
                          error={queryError}
                          isLoading={isQueryLoading}
                          metadata={queryMetadata}
                        />
                      </div>
                      
                      {/* Query Input Area */}
                      <div className="p-3 border-t border-slate-200">
                        <QueryInput 
                          onSubmit={handleQuerySubmit}
                          isLoading={isQueryLoading}
                          isDisabled={!fileData || !isServerRunning}
                        />
                        
                        {/* Suggested Queries */}
                        {fileData && (
                          <div className="mt-2">
                            <SuggestedQueries
                              fileData={fileData}
                              context={{
                                selectedSignals,
                                primaryCursor: primaryCursor.visible ? primaryCursor : undefined,
                                diffCursor: diffCursor.visible ? diffCursor : undefined,
                                timeRange: plotData?.layout?.xaxis?.range as [number, number] | undefined
                              }}
                              onSelectQuery={handleQuerySubmit}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {rightPanelTab === 'annotations' && (
                    <div className="p-3">
                      <Annotations 
                        annotations={annotations}
                        onAddAnnotation={handleAddAnnotation}
                        onDeleteAnnotation={handleDeleteAnnotation}
                        isConnected={isConnected}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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
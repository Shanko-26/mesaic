'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, FileUp, Clock, List, ZoomIn, ZoomOut, RotateCcw, Eye, MessageCircle, Users, X } from 'lucide-react';
import { 
  getCurrentFile, 
  getFileData, 
  getRecentFiles, 
  loadFileFromServer, 
  FileInfo, 
  FileData 
} from '../services/file';
import {
  generatePlotData,
  createPlot,
  updatePlot,
  zoomIn as zoomInPlot,
  zoomOut as zoomOutPlot,
  resetZoom as resetZoomPlot,
  updateCursors,
  getCursorValues,
  CursorData
} from '../services/visualization';

/**
 * EnhancedLayout - The main UI layout for MesAIc
 * 
 * Features:
 * - Three-panel layout with collapsible sidebars
 * - File management and signal selection
 * - Interactive plot visualization
 * - AI chat and data analysis
 * - Annotation system
 */
export function EnhancedLayout() {
  // State for panel visibility
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [bottomBarCollapsed, setBottomBarCollapsed] = useState(false);
  
  // State for active tabs
  const [activeLeftTab, setActiveLeftTab] = useState<'files' | 'signals'>('signals');
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'analysis'>('chat');
  
  // State for file and data
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for cursors
  const [primaryCursor, setPrimaryCursor] = useState<CursorData>({
    x: 0,
    visible: false,
    color: 'rgba(255, 0, 0, 0.75)',
    label: 'Primary'
  });
  
  // State for chat
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'assistant', text: string}>>([
    { type: 'assistant', text: "Hello! I'm your MesAIc assistant. How can I help you analyze your signal data today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Refs
  const plotContainerRef = useRef<HTMLDivElement>(null);
  
  // Add state for annotations
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    text: string;
    timeRange?: { start: number; end?: number };
    createdAt: Date;
  }>>([
    {
      id: '1',
      text: 'Unusual vibration detected in this region',
      timeRange: { start: 42.1, end: 45.3 },
      createdAt: new Date()
    }
  ]);
  
  // Load initial data
  useEffect(() => {
    setCurrentFile(getCurrentFile());
    setFileData(getFileData());
    setRecentFiles(getRecentFiles());
  }, []);
  
  // Update selected signals when file data changes
  useEffect(() => {
    if (fileData && fileData.signals) {
      // Initially select all signals except time
      const signalsToSelect = fileData.signals.filter(signal => signal !== 'time');
      setSelectedSignals(signalsToSelect);
    }
  }, [fileData]);
  
  // Create plot when file data and selected signals change
  useEffect(() => {
    if (fileData && selectedSignals.length > 0 && plotContainerRef.current) {
      try {
        console.log('Creating plot with selected signals:', selectedSignals);
        const plotData = generatePlotData(fileData, selectedSignals, {
          title: currentFile?.name || 'Signal Visualization',
          showLegend: true,
          lineWidth: 2
        }, primaryCursor);
        
        // Clear the container first to avoid duplicate plots
        if (plotContainerRef.current) {
          while (plotContainerRef.current.firstChild) {
            plotContainerRef.current.removeChild(plotContainerRef.current.firstChild);
          }
        }
        
        createPlot('plot-container', plotData)
          .then(() => {
            console.log('Plot created successfully');
          })
          .catch((err: Error) => {
            console.error('Error creating plot:', err);
            setError(`Failed to create plot: ${err.message}`);
          });
      } catch (err: unknown) {
        console.error('Error generating plot data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to generate plot data: ${errorMessage}`);
      }
    }
  }, [fileData, selectedSignals, primaryCursor, currentFile]);
  
  // Handle file selection
  const handleFileSelect = async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await loadFileFromServer(filePath);
      setFileData(data);
      setCurrentFile(getCurrentFile());
      setRecentFiles(getRecentFiles());
      
      // Switch to signals tab after loading file
      setActiveLeftTab('signals');
    } catch (error) {
      console.error('Error loading file:', error);
      setError('Failed to load file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if window.electron is available
      if (typeof window.electron === 'undefined') {
        console.warn('Electron API not available');
        // Fallback to sample data for testing
        const data = await loadFileFromServer('sample_data.mat');
        setFileData(data);
        setCurrentFile(getCurrentFile());
        setRecentFiles(getRecentFiles());
        setActiveLeftTab('signals');
        return;
      }
      
      // Use electron API to open file dialog
      const filePath = await window.electron.fileSystem.openFileDialog(['mat', 'mf4']);
      if (filePath) {
        const data = await loadFileFromServer(filePath);
        setFileData(data);
        setCurrentFile(getCurrentFile());
        setRecentFiles(getRecentFiles());
        
        // Switch to signals tab after loading file
        setActiveLeftTab('signals');
        console.log('File loaded successfully:', filePath);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again or use sample data.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a function to load sample data
  const handleLoadSampleData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading sample data');
      const data = await loadFileFromServer('sample_data.mat');
      setFileData(data);
      setCurrentFile(getCurrentFile());
      setRecentFiles(getRecentFiles());
      
      // Switch to signals tab after loading file
      setActiveLeftTab('signals');
      console.log('Sample data loaded successfully');
    } catch (error) {
      console.error('Error loading sample data:', error);
      setError('Failed to load sample data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle signal selection
  const handleSignalSelect = (signal: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedSignals(prev => [...prev, signal]);
    } else {
      setSelectedSignals(prev => prev.filter(s => s !== signal));
    }
  };
  
  // Handle select all signals
  const handleSelectAllSignals = () => {
    if (fileData) {
      const allSignals = fileData.signals.filter(signal => signal !== 'time');
      setSelectedSignals(allSignals);
    }
  };
  
  // Handle clear all signals
  const handleClearAllSignals = () => {
    setSelectedSignals([]);
  };
  
  // Handle plot zoom in
  const handleZoomIn = () => {
    zoomInPlot('plot-container');
  };
  
  // Handle plot zoom out
  const handleZoomOut = () => {
    zoomOutPlot('plot-container');
  };
  
  // Handle plot reset
  const handleResetZoom = () => {
    resetZoomPlot('plot-container');
  };
  
  // Handle plot click for cursor positioning
  const handlePlotClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!plotContainerRef.current || !fileData || !fileData.data.time) {
      console.log('Plot click ignored - missing prerequisites');
      return;
    }
    
    try {
      console.log('Plot clicked, calculating cursor position');
      // Get the plot container dimensions
      const rect = plotContainerRef.current.getBoundingClientRect();
      
      // Calculate the relative position within the plot (0-1)
      const relativeX = (event.clientX - rect.left) / rect.width;
      console.log('Relative X position:', relativeX);
      
      // Get the time axis
      const timeAxis = fileData.data.time;
      if (!Array.isArray(timeAxis) || timeAxis.length === 0) {
        console.warn('Time axis is not available or empty');
        return;
      }
      
      // Scale the relative position to the time range
      const timeMin = Math.min(...timeAxis);
      const timeMax = Math.max(...timeAxis);
      const timeValue = timeMin + relativeX * (timeMax - timeMin);
      console.log('Calculated time value:', timeValue);
      
      // Find the closest time point in the data
      let closestIndex = 0;
      let closestDistance = Math.abs(timeAxis[0] - timeValue);
      
      for (let i = 1; i < timeAxis.length; i++) {
        const distance = Math.abs(timeAxis[i] - timeValue);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      
      const exactTimeValue = timeAxis[closestIndex];
      console.log('Closest time value in data:', exactTimeValue, 'at index', closestIndex);
      
      // Update cursor
      const newCursor = {
        ...primaryCursor,
        x: exactTimeValue,
        visible: true
      };
      
      console.log('Setting new cursor:', newCursor);
      setPrimaryCursor(newCursor);
      
      // Update the plot with the new cursor
      updateCursors('plot-container', newCursor, undefined, timeAxis);
    } catch (err) {
      console.error('Error handling plot click:', err);
    }
  };
  
  // Get cursor values for display
  const getCursorDisplayValues = () => {
    if (!fileData || !primaryCursor.visible) return {};
    
    return getCursorValues(fileData, selectedSignals, primaryCursor.x);
  };
  
  const cursorValues = getCursorDisplayValues();
  
  // Handle chat input change
  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
  };
  
  // Handle sending a chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: 'user' as const, text: chatInput.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);
    
    try {
      // Generate a response based on the message and available data
      let response = "I'm analyzing your request...";
      
      // Simple response logic based on the message content
      if (fileData && selectedSignals.length > 0) {
        if (chatInput.toLowerCase().includes('maximum') || chatInput.toLowerCase().includes('max')) {
          // Find maximum values for selected signals
          const maxValues: Record<string, number> = {};
          let maxSignal = '';
          let maxValue = -Infinity;
          
          selectedSignals.forEach(signal => {
            const values = fileData.data[signal];
            if (values && Array.isArray(values)) {
              const max = Math.max(...values);
              maxValues[signal] = max;
              
              if (max > maxValue) {
                maxValue = max;
                maxSignal = signal;
              }
            }
          });
          
          response = `The maximum value I found is ${maxValue.toFixed(2)} in the ${maxSignal} signal.`;
          
          // Add details for other signals if there are multiple
          if (selectedSignals.length > 1) {
            response += " Here are the maximum values for all selected signals:\n";
            selectedSignals.forEach(signal => {
              if (maxValues[signal]) {
                const unit = fileData.metadata?.units?.[signal] || '';
                response += `\n- ${signal}: ${maxValues[signal].toFixed(2)}${unit ? ' ' + unit : ''}`;
              }
            });
          }
        } else if (chatInput.toLowerCase().includes('minimum') || chatInput.toLowerCase().includes('min')) {
          // Find minimum values for selected signals
          const minValues: Record<string, number> = {};
          let minSignal = '';
          let minValue = Infinity;
          
          selectedSignals.forEach(signal => {
            const values = fileData.data[signal];
            if (values && Array.isArray(values)) {
              const min = Math.min(...values);
              minValues[signal] = min;
              
              if (min < minValue) {
                minValue = min;
                minSignal = signal;
              }
            }
          });
          
          response = `The minimum value I found is ${minValue.toFixed(2)} in the ${minSignal} signal.`;
          
          // Add details for other signals if there are multiple
          if (selectedSignals.length > 1) {
            response += " Here are the minimum values for all selected signals:\n";
            selectedSignals.forEach(signal => {
              if (minValues[signal]) {
                const unit = fileData.metadata?.units?.[signal] || '';
                response += `\n- ${signal}: ${minValues[signal].toFixed(2)}${unit ? ' ' + unit : ''}`;
              }
            });
          }
        } else if (chatInput.toLowerCase().includes('average') || chatInput.toLowerCase().includes('avg') || chatInput.toLowerCase().includes('mean')) {
          // Calculate averages for selected signals
          const avgValues: Record<string, number> = {};
          
          selectedSignals.forEach(signal => {
            const values = fileData.data[signal];
            if (values && Array.isArray(values)) {
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
              avgValues[signal] = avg;
            }
          });
          
          response = "Here are the average values for the selected signals:\n";
          selectedSignals.forEach(signal => {
            if (avgValues[signal]) {
              const unit = fileData.metadata?.units?.[signal] || '';
              response += `\n- ${signal}: ${avgValues[signal].toFixed(2)}${unit ? ' ' + unit : ''}`;
            }
          });
        } else if (chatInput.toLowerCase().includes('compare')) {
          response = "Here's a comparison of the selected signals:\n";
          
          selectedSignals.forEach(signal => {
            const values = fileData.data[signal];
            if (values && Array.isArray(values)) {
              const min = Math.min(...values);
              const max = Math.max(...values);
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
              const unit = fileData.metadata?.units?.[signal] || '';
              
              response += `\n- ${signal}: Min=${min.toFixed(2)}, Max=${max.toFixed(2)}, Avg=${avg.toFixed(2)}${unit ? ' ' + unit : ''}`;
            }
          });
        } else {
          response = "I can help you analyze your data. Try asking about maximum values, minimum values, averages, or comparing signals.";
        }
      } else if (!fileData) {
        response = "Please load a data file first so I can help you analyze it.";
      } else if (selectedSignals.length === 0) {
        response = "Please select some signals from the sidebar so I can analyze them for you.";
      }
      
      // Add assistant response to chat
      setTimeout(() => {
        setChatMessages(prev => [...prev, { type: 'assistant', text: response }]);
        setIsSendingMessage(false);
      }, 500); // Simulate a slight delay for realism
    } catch (error) {
      console.error('Error generating chat response:', error);
      setChatMessages(prev => [...prev, { type: 'assistant', text: "I'm sorry, I encountered an error while processing your request." }]);
      setIsSendingMessage(false);
    }
  };
  
  // Handle quick chat suggestions
  const handleQuickSuggestion = (suggestion: string) => {
    setChatInput(suggestion);
  };
  
  // Add function to handle adding a new annotation
  const handleAddAnnotation = () => {
    if (!primaryCursor.visible) {
      // If no cursor is visible, show an error or prompt
      setError('Please position the cursor first to add an annotation at that point.');
      return;
    }
    
    // Create a simple prompt for the annotation text
    const annotationText = window.prompt('Enter annotation text:');
    if (!annotationText) return; // User cancelled
    
    // Create a new annotation
    const newAnnotation = {
      id: Date.now().toString(),
      text: annotationText,
      timeRange: { start: primaryCursor.x },
      createdAt: new Date()
    };
    
    // Add to annotations
    setAnnotations(prev => [newAnnotation, ...prev]);
  };
  
  // Add function to handle removing an annotation
  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main content area with sidebars */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div 
          className={`border-r border-border transition-all duration-300 flex flex-col ${
            leftSidebarCollapsed ? 'w-10' : 'w-64'
          }`}
        >
          {/* Toggle button */}
          <button 
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className="p-2 text-muted-foreground hover:text-foreground self-end"
            aria-label={leftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {leftSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          
          {!leftSidebarCollapsed && (
            <>
              {/* Tab navigation */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveLeftTab('files')}
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeLeftTab === 'files'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveLeftTab('signals')}
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeLeftTab === 'signals'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Signals
                </button>
              </div>
              
              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-3">
                {activeLeftTab === 'files' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">File Upload</h3>
                      <button 
                        className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        onClick={handleFileUpload}
                        disabled={isLoading}
                      >
                        <FileUp size={16} />
                        <span>{isLoading ? 'Loading...' : 'Select File'}</span>
                      </button>
                      <button 
                        className="w-full mt-2 flex items-center justify-center gap-2 p-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90"
                        onClick={handleLoadSampleData}
                        disabled={isLoading}
                      >
                        <span>Load Sample Data</span>
                      </button>
                      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Clock size={14} />
                        <span>Recent Files</span>
                      </h3>
                      <div className="space-y-1">
                        {recentFiles.length > 0 ? (
                          recentFiles.map((file) => (
                            <button
                              key={file.path}
                              className={`w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-md truncate ${
                                currentFile?.path === file.path ? 'bg-accent/50' : ''
                              }`}
                              onClick={() => handleFileSelect(file.path)}
                            >
                              {file.name}
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No recent files</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeLeftTab === 'signals' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search signals..."
                        className="w-full p-2 text-sm border border-border rounded-md"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <List size={14} />
                          <span>Available Signals</span>
                        </h3>
                        <div className="flex gap-1">
                          <button 
                            className="text-xs px-1 bg-accent rounded"
                            onClick={handleSelectAllSignals}
                          >
                            All
                          </button>
                          <button 
                            className="text-xs px-1 hover:bg-accent rounded"
                            onClick={handleClearAllSignals}
                          >
                            None
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto">
                        {fileData ? (
                          fileData.signals
                            .filter(signal => signal !== 'time')
                            .map((signal) => {
                              // Extract group from signal name if available
                              const groupMatch = signal.match(/^([a-zA-Z]+)/);
                              const group = groupMatch ? groupMatch[1] : 'Other';
                              
                              return (
                                <div key={signal} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`signal-${signal}`}
                                    className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    checked={selectedSignals.includes(signal)}
                                    onChange={(e) => handleSignalSelect(signal, e.target.checked)}
                                  />
                                  <label
                                    htmlFor={`signal-${signal}`}
                                    className="flex-1 text-sm cursor-pointer py-1"
                                  >
                                    {signal}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {group}
                                    </span>
                                  </label>
                                </div>
                              );
                            })
                        ) : (
                          <p className="text-xs text-muted-foreground">No file loaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Plot toolbar */}
          <div className="border-b border-border p-2 flex items-center justify-between bg-accent/30">
            <div className="flex items-center space-x-1">
              <button 
                className="p-1 text-muted-foreground hover:text-foreground bg-background hover:bg-accent rounded-md" 
                title="Zoom In"
                onClick={handleZoomIn}
              >
                <ZoomIn size={16} />
              </button>
              <button 
                className="p-1 text-muted-foreground hover:text-foreground bg-background hover:bg-accent rounded-md" 
                title="Zoom Out"
                onClick={handleZoomOut}
              >
                <ZoomOut size={16} />
              </button>
              <button 
                className="p-1 text-muted-foreground hover:text-foreground bg-background hover:bg-accent rounded-md" 
                title="Reset View"
                onClick={handleResetZoom}
              >
                <RotateCcw size={16} />
              </button>
              <div className="h-4 border-r border-border mx-1"></div>
              <button 
                className={`p-1 ${primaryCursor.visible ? 'text-primary' : 'text-muted-foreground'} hover:text-primary/80 bg-background hover:bg-accent rounded-md`} 
                title="Primary Cursor"
              >
                <Eye size={16} />
              </button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Click to position cursor • Shift+Click for diff cursor
            </div>
            
            <div className="flex items-center space-x-1">
              <button className="text-xs px-2 py-1 bg-background hover:bg-accent rounded-md">
                Export
              </button>
              <button className="text-xs px-2 py-1 bg-background hover:bg-accent rounded-md">
                Settings
              </button>
            </div>
          </div>
          
          {/* Plot area */}
          <div 
            className="flex-1 overflow-hidden p-4 bg-background"
            onClick={handlePlotClick}
          >
            <div 
              id="plot-container"
              ref={plotContainerRef}
              className="h-full border border-dashed border-border rounded-md flex items-center justify-center"
            >
              {isLoading ? (
                <div className="text-center">
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              ) : !fileData ? (
                <div className="text-center">
                  <p className="text-muted-foreground">Plot Visualization Area</p>
                  <p className="text-xs text-muted-foreground mt-1">Load a file to display data</p>
                </div>
              ) : selectedSignals.length === 0 ? (
                <div className="text-center">
                  <p className="text-muted-foreground">No signals selected</p>
                  <p className="text-xs text-muted-foreground mt-1">Select signals from the sidebar</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Right panel */}
        <div 
          className={`border-l border-border transition-all duration-300 flex flex-col ${
            rightPanelCollapsed ? 'w-10' : 'w-80'
          }`}
        >
          {/* Toggle button */}
          <button 
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-2 text-muted-foreground hover:text-foreground self-start"
            aria-label={rightPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {!rightPanelCollapsed && (
            <>
              {/* Tab navigation */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveRightTab('chat')}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                    activeRightTab === 'chat'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageCircle size={14} />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveRightTab('analysis')}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                    activeRightTab === 'analysis'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List size={14} />
                  <span>Analysis</span>
                </button>
              </div>
              
              {/* Tab content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {activeRightTab === 'chat' && (
                  <>
                    {/* Chat history */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                      {chatMessages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg ${
                            message.type === 'assistant' 
                              ? 'bg-accent/30 rounded-tl-none' 
                              : 'bg-primary/10 rounded-tr-none ml-auto'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">
                            {message.text}
                          </p>
                        </div>
                      ))}
                      {isSendingMessage && (
                        <div className="bg-accent/30 p-3 rounded-lg rounded-tl-none">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></div>
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300"></div>
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat input */}
                    <div className="p-3 border-t border-border">
                      <div className="flex items-end gap-2">
                        <textarea
                          value={chatInput}
                          onChange={handleChatInputChange}
                          placeholder="Ask a question about your data..."
                          className="flex-1 p-2 text-sm border border-border rounded-md min-h-[60px] resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        ></textarea>
                        <button 
                          className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || isSendingMessage}
                        >
                          Send
                        </button>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button 
                          className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent rounded-full"
                          onClick={() => handleQuickSuggestion('What is the maximum value in the data?')}
                        >
                          Max value?
                        </button>
                        <button 
                          className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent rounded-full"
                          onClick={() => handleQuickSuggestion('Compare all selected signals')}
                        >
                          Compare signals
                        </button>
                        <button 
                          className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent rounded-full"
                          onClick={() => handleQuickSuggestion('What is the average of each signal?')}
                        >
                          Average values
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {activeRightTab === 'analysis' && (
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-4">
                      {fileData && selectedSignals.length > 0 ? (
                        <>
                          <div className="border border-border rounded-md p-3">
                            <h3 className="text-sm font-medium mb-2">Signal Information</h3>
                            
                            <div className="space-y-3">
                              {selectedSignals.map(signal => {
                                const values = fileData.data[signal];
                                if (!values || !Array.isArray(values)) return null;
                                
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                                
                                return (
                                  <div key={signal} className="border-b border-border pb-2">
                                    <h4 className="text-sm font-medium">{signal}</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                      <span className="text-xs text-muted-foreground">Min:</span>
                                      <span className="text-xs">{min.toFixed(2)}</span>
                                      <span className="text-xs text-muted-foreground">Max:</span>
                                      <span className="text-xs">{max.toFixed(2)}</span>
                                      <span className="text-xs text-muted-foreground">Avg:</span>
                                      <span className="text-xs">{avg.toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {primaryCursor.visible && (
                            <div className="border border-border rounded-md p-3">
                              <h3 className="text-sm font-medium mb-2">Cursor Values</h3>
                              <div className="text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span>{primaryCursor.x.toFixed(2)}s</span>
                                </div>
                                {Object.entries(cursorValues).map(([signal, value]) => (
                                  <div key={signal} className="flex justify-between mt-1">
                                    <span className="text-muted-foreground">{signal}:</span>
                                    <span>{value.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">No data to analyze</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {!fileData ? 'Load a file first' : 'Select signals to analyze'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Bottom bar */}
      <div 
        className={`border-t border-border transition-all duration-300 ${
          bottomBarCollapsed ? 'h-10' : 'h-40'
        }`}
      >
        <div className="flex justify-between items-center px-4 h-10">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-sm">
              <Users size={14} />
              <span>Collaboration</span>
            </button>
          </div>
          
          <button 
            onClick={() => setBottomBarCollapsed(!bottomBarCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label={bottomBarCollapsed ? "Expand annotations" : "Collapse annotations"}
          >
            {bottomBarCollapsed ? 'Show Annotations' : 'Hide Annotations'}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-muted-foreground">Server Connected</span>
            </div>
          </div>
        </div>
        
        {!bottomBarCollapsed && (
          <div className="p-3 overflow-y-auto h-[calc(100%-40px)]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Annotations</h3>
              <button 
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                onClick={handleAddAnnotation}
              >
                Add Note
              </button>
            </div>
            
            <div className="space-y-2">
              {primaryCursor.visible && (
                <div className="border border-border rounded-md p-2 bg-accent/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm">Cursor positioned at {primaryCursor.x.toFixed(2)}s</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to add annotation</p>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {annotations.map(annotation => (
                <div key={annotation.id} className="border border-border rounded-md p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm">{annotation.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {annotation.timeRange?.end 
                          ? `From ${annotation.timeRange.start.toFixed(2)}s to ${annotation.timeRange.end.toFixed(2)}s` 
                          : `At ${annotation.timeRange?.start.toFixed(2)}s`}
                      </p>
                    </div>
                    <button 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveAnnotation(annotation.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {annotations.length === 0 && !primaryCursor.visible && (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No annotations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Position the cursor and click "Add Note" to create an annotation
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
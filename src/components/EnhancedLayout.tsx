'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, FileUp, Clock, List, ZoomIn, ZoomOut, RotateCcw, Eye, MessageCircle, Users, X, ChevronDown } from 'lucide-react';
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
  CursorData,
  positionCursorAtTime,
  enableBrushSelection,
  disableBrushSelection,
  configureMultiYAxes,
  toggleLogarithmicScale,
  applySmoothingToSignal,
  PlotData
} from '../services/visualization';
import {
  generateChatResponse,
  processAIQuery,
  executeSignalOperation
} from '../services/ai';
import { PlotArea } from './Visualization/PlotArea';
import { StatisticsDisplay } from './StatisticsDisplay';

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
declare global {
  interface Window {
    electron?: {
      fileSystem: {
        openFileDialog: (extensions: string[]) => Promise<string | null>;
      };
    };
  }
}

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
  
  // State for derived signals
  const [derivedSignals, setDerivedSignals] = useState<Record<string, {
    data: number[];
    metadata: Record<string, any>;
  }>>({});
  
  // State for cursors
  const [primaryCursor, setPrimaryCursor] = useState<CursorData>({
    x: 0,
    visible: false,
    color: 'rgba(255, 0, 0, 0.75)',
    label: 'Primary'
  });
  
  // Add state for secondary cursor (diff cursor)
  const [diffCursor, setDiffCursor] = useState<CursorData>({
    x: 0,
    visible: false,
    color: 'rgba(0, 0, 255, 0.75)',
    label: 'Diff'
  });
  
  // Add state for cursor mode
  const [cursorMode, setCursorMode] = useState<'primary' | 'diff'>('primary');
  
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
  
  // Add state for signal filtering
  const [signalFilter, setSignalFilter] = useState('');
  const [signalGroups, setSignalGroups] = useState<Record<string, string[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Add state for visualization options
  const [brushSelectionEnabled, setBrushSelectionEnabled] = useState(false);
  const [multiYAxisEnabled, setMultiYAxisEnabled] = useState(false);
  const [logScaleEnabled, setLogScaleEnabled] = useState(false);
  const [smoothingOptions, setSmoothingOptions] = useState<{
    enabled: boolean;
    signal: string;
    windowSize: number;
    method: 'movingAverage' | 'exponential';
  }>({
    enabled: false,
    signal: '',
    windowSize: 5,
    method: 'movingAverage'
  });
  
  // Add state for plot data
  const [plotData, setPlotData] = useState<PlotData | undefined>(undefined);
  
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
      
      // Group signals by prefix
      const groups: Record<string, string[]> = {};
      
      signalsToSelect.forEach(signal => {
        // Extract group from signal name if available
        const groupMatch = signal.match(/^([a-zA-Z]+)/);
        const group = groupMatch ? groupMatch[1] : 'Other';
        
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(signal);
      });
      
      setSignalGroups(groups);
      
      // Initialize all groups as expanded
      const initialExpandedState: Record<string, boolean> = {};
      Object.keys(groups).forEach(group => {
        initialExpandedState[group] = true;
      });
      setExpandedGroups(initialExpandedState);
    }
  }, [fileData]);
  
  // Update the plot data when file data or selected signals change
  useEffect(() => {
    if (fileData && selectedSignals.length > 0) {
      // Create a merged data object that includes both original and derived signals
      const mergedData = { ...fileData.data };
      
      // Add derived signals to the merged data
      Object.entries(derivedSignals).forEach(([name, signal]) => {
        mergedData[name] = signal.data;
      });
      
      // Create a merged file data object
      const mergedFileData: FileData = {
        ...fileData,
        data: mergedData,
        signals: [...fileData.signals, ...Object.keys(derivedSignals)]
      };
      
      const newPlotData = generatePlotData(mergedFileData, selectedSignals, {
        title: currentFile?.name || 'Signal Visualization',
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
        showLegend: true
      }, primaryCursor, diffCursor);
      
      setPlotData(newPlotData);
    } else {
      setPlotData(undefined);
    }
  }, [fileData, selectedSignals, currentFile, primaryCursor, diffCursor, derivedSignals]);
  
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
  
  // Handle cursor movement from the plot
  const handleCursorMove = (x: number, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryCursor({
        ...primaryCursor,
        x,
        visible: true
      });
    } else {
      setDiffCursor({
        ...diffCursor,
        x,
        visible: true
      });
    }
  };
  
  // Add function to toggle cursor mode
  const toggleCursorMode = () => {
    setCursorMode(prev => prev === 'primary' ? 'diff' : 'primary');
  };
  
  // Add function to clear cursors
  const clearCursors = () => {
    setPrimaryCursor(prev => ({ ...prev, visible: false }));
    setDiffCursor(prev => ({ ...prev, visible: false }));
    
    // Update the plot to remove cursors
    if (fileData && fileData.data.time) {
      updateCursors('plot-container', 
        { ...primaryCursor, visible: false }, 
        { ...diffCursor, visible: false }, 
        fileData.data.time
      );
    }
  };
  
  // Get cursor values for display including diff values
  const getCursorDisplayValues = () => {
    if (!fileData) return { primary: {}, diff: {}, difference: {} };
    
    const primaryValues = primaryCursor.visible ? 
      getCursorValues(fileData, selectedSignals, primaryCursor.x) : {};
    
    const diffValues = diffCursor.visible ? 
      getCursorValues(fileData, selectedSignals, diffCursor.x) : {};
    
    // Calculate differences if both cursors are visible
    const differenceValues: Record<string, number> = {};
    
    if (primaryCursor.visible && diffCursor.visible) {
      selectedSignals.forEach(signal => {
        if (primaryValues[signal] !== undefined && diffValues[signal] !== undefined) {
          differenceValues[signal] = primaryValues[signal] - diffValues[signal];
        }
      });
    }
    
    return { primary: primaryValues, diff: diffValues, difference: differenceValues };
  };
  
  // Update the cursorValues calculation
  const cursorValues = getCursorDisplayValues();
  
  // Update the handleSendMessage function to handle incomplete queries
  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage = { type: 'user' as const, text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);
    
    try {
      // Check if this is a signal processing operation
      const normalizedMessage = message.toLowerCase();
      const isSignalOperation = 
        normalizedMessage.includes('multiply') || 
        normalizedMessage.includes('add') || 
        normalizedMessage.includes('subtract') || 
        normalizedMessage.includes('divide') || 
        normalizedMessage.includes('filter') || 
        normalizedMessage.includes('derivative') || 
        normalizedMessage.includes('absolute') || 
        normalizedMessage.includes('abs') || 
        normalizedMessage.includes('fft') || 
        normalizedMessage.includes('statistics') || 
        normalizedMessage.includes('stats');
      
      if (isSignalOperation && fileData) {
        // Use the signal processing API
        try {
          // Get available signals
          const availableSignals = fileData ? 
            [...fileData.signals] : [];
          
          // Process the query
          const result = await processAIQuery(message, availableSignals);
          
          if (result.operations.length > 0) {
            // Check if any operations have missing information
            const incompleteOperations = result.operations.filter(op => {
              // Check for required signals based on operation type
              if (['add', 'subtract', 'multiply', 'divide'].includes(op.operation) && op.signals.length < 2) {
                return true;
              }
              if (['abs', 'scale', 'derivative', 'filter', 'fft', 'stats'].includes(op.operation) && op.signals.length < 1) {
                return true;
              }
              
              // Check for required parameters based on operation type
              if (op.operation === 'scale' && (!op.parameters || op.parameters.factor === undefined)) {
                return true;
              }
              if (op.operation === 'derivative' && (!op.parameters || op.parameters.order === undefined)) {
                return true;
              }
              if (op.operation === 'filter') {
                if (!op.parameters) return true;
                if (op.parameters.filter_type === undefined) return true;
                if (op.parameters.cutoff_freq === undefined) return true;
                if (['bandpass', 'bandstop'].includes(op.parameters.filter_type) && 
                    (!Array.isArray(op.parameters.cutoff_freq) || op.parameters.cutoff_freq.length !== 2)) {
                  return true;
                }
              }
              if (op.operation === 'fft' && (!op.parameters || op.parameters.sample_rate === undefined)) {
                return true;
              }
              
              return false;
            });
            
            if (incompleteOperations.length > 0) {
              // Create a response asking for more information
              let responseMessage = "I need more information to process your request:\n\n";
              
              incompleteOperations.forEach(op => {
                responseMessage += `For the ${op.operation} operation:\n`;
                
                // Check for missing signals
                if (['add', 'subtract', 'multiply', 'divide'].includes(op.operation)) {
                  if (!op.signals || op.signals.length === 0) {
                    responseMessage += `- Please specify which two signals to ${op.operation}.\n`;
                    responseMessage += `  Available signals: ${availableSignals.join(', ')}\n`;
                  } else if (op.signals.length === 1) {
                    responseMessage += `- You specified ${op.signals[0]}, but I need one more signal to ${op.operation} with.\n`;
                    responseMessage += `  Available signals: ${availableSignals.filter(s => s !== op.signals[0]).join(', ')}\n`;
                  }
                }
                
                if (['abs', 'scale', 'derivative', 'filter', 'fft', 'stats'].includes(op.operation) && (!op.signals || op.signals.length === 0)) {
                  responseMessage += `- Please specify which signal to apply the ${op.operation} operation to.\n`;
                  responseMessage += `  Available signals: ${availableSignals.join(', ')}\n`;
                }
                
                // Check for missing parameters
                if (op.operation === 'scale' && (!op.parameters || op.parameters.factor === undefined)) {
                  responseMessage += `- Please specify the scaling factor (e.g., 2.5 to multiply by 2.5).\n`;
                }
                
                if (op.operation === 'derivative') {
                  if (!op.parameters || op.parameters.order === undefined) {
                    responseMessage += `- Please specify the derivative order (1 for first derivative, 2 for second derivative).\n`;
                  }
                }
                
                if (op.operation === 'filter') {
                  if (!op.parameters || op.parameters.filter_type === undefined) {
                    responseMessage += `- Please specify the filter type (lowpass, highpass, bandpass, or bandstop).\n`;
                  }
                  
                  if (!op.parameters || op.parameters.cutoff_freq === undefined) {
                    responseMessage += `- Please specify the cutoff frequency (between 0 and 1).\n`;
                  } else if (['bandpass', 'bandstop'].includes(op.parameters.filter_type) && 
                            (!Array.isArray(op.parameters.cutoff_freq) || op.parameters.cutoff_freq.length !== 2)) {
                    responseMessage += `- For ${op.parameters.filter_type} filter, please specify two cutoff frequencies (low and high).\n`;
                  }
                }
                
                if (op.operation === 'fft' && (!op.parameters || op.parameters.sample_rate === undefined)) {
                  responseMessage += `- Please specify the sample rate for the FFT operation.\n`;
                }
                
                responseMessage += '\n';
              });
              
              responseMessage += "Please provide the missing information by responding with a more specific request.";
              
              // Add assistant response to chat
              setChatMessages(prev => [...prev, { type: 'assistant', text: responseMessage }]);
              setIsSendingMessage(false);
              return;
            }
            
            // Get the signals data
            const signalsData: Record<string, number[]> = {};
            
            // Add original signals
            if (fileData && fileData.data) {
              Object.keys(fileData.data).forEach(signal => {
                signalsData[signal] = fileData.data[signal];
              });
            }
            
            // Execute each operation
            const newDerivedSignals: Record<string, {
              data: number[];
              metadata: Record<string, any>;
            }> = {};
            
            for (const operation of result.operations) {
              const opResult = await executeSignalOperation(operation, signalsData);
              
              // Add the result to derived signals
              newDerivedSignals[operation.outputName] = opResult;
              
              // Add to signals data for potential use in subsequent operations
              signalsData[operation.outputName] = opResult.data;
            }
            
            // Update derived signals
            setDerivedSignals(prevSignals => ({
              ...prevSignals,
              ...newDerivedSignals
            }));
            
            // Create a response message with the results
            const responseMessage = `${result.explanation}\n\nI've created the following new signals:\n${
              Object.entries(newDerivedSignals)
                .map(([name, signal]) => `- ${name}: ${signal.metadata.description || 'Processed signal'}`)
                .join('\n')
            }`;
            
            // Add assistant response to chat
            setChatMessages(prev => [...prev, { type: 'assistant', text: responseMessage }]);
            
            // Add the new signals to the selected signals
            setSelectedSignals(prev => [...prev, ...Object.keys(newDerivedSignals)]);
            
            setIsSendingMessage(false);
            return;
          }
        } catch (error) {
          console.error('Error processing signal operation:', error);
          // Fall back to regular chat response
        }
      }
      
      // Get cursor values for the AI service
      const cursorValues = getCursorDisplayValues();
      
      // Generate a response based on the message and available data using the AI service
      const response = await generateChatResponse(
        message,
        fileData,
        selectedSignals,
        { primaryCursor, diffCursor },
        cursorValues
      );
      
      // Simplify the cursor positioning code to avoid linter errors
      if (response.cursorPosition && fileData && fileData.data.time) {
        // Create a basic cursor data object
        const cursorData: CursorData = {
          x: response.cursorPosition.x,
          visible: true,
          color: 'primary'
        };
        
        try {
          // Call the function with the correct arguments
          const newCursor = positionCursorAtTime(
            'plot-container',
            cursorData,
            response.cursorPosition.x,
            fileData.data.time
          );
          
          if (newCursor) {
            setPrimaryCursor(newCursor);
          }
        } catch (error) {
          console.error('Error positioning cursor:', error);
        }
      }
      
      // Add assistant response to chat
      setChatMessages(prev => [...prev, { type: 'assistant', text: response.message }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, { 
        type: 'assistant', 
        text: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    }
    
    setIsSendingMessage(false);
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
  
  // Handle signal filter change
  const handleSignalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalFilter(e.target.value);
  };
  
  // Toggle group expansion
  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  // Get filtered signals
  const getFilteredSignals = () => {
    if (!fileData) return [];
    
    const signals = fileData.signals.filter(signal => signal !== 'time');
    
    if (!signalFilter) return signals;
    
    return signals.filter(signal => 
      signal.toLowerCase().includes(signalFilter.toLowerCase())
    );
  };
  
  // Toggle brush selection mode
  const toggleBrushSelection = () => {
    if (brushSelectionEnabled) {
      disableBrushSelection('plot-container');
    } else {
      enableBrushSelection('plot-container');
    }
    setBrushSelectionEnabled(!brushSelectionEnabled);
  };
  
  // Toggle multi-Y axis mode
  const toggleMultiYAxis = async () => {
    if (!fileData || selectedSignals.length === 0) return;
    
    if (!multiYAxisEnabled) {
      // Group signals by prefix
      const groups: Record<string, string[]> = {};
      
      selectedSignals.forEach(signal => {
        // Extract group from signal name if available
        const groupMatch = signal.match(/^([a-zA-Z]+)/);
        const group = groupMatch ? groupMatch[1] : 'Other';
        
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(signal);
      });
      
      await configureMultiYAxes('plot-container', groups, fileData);
    } else {
      // Reset to standard plot
      const plotData = generatePlotData(fileData, selectedSignals, {
        title: currentFile?.name || 'Signal Visualization',
        showLegend: true,
        lineWidth: 2
      }, primaryCursor, diffCursor);
      
      await updatePlot('plot-container', plotData);
    }
    
    setMultiYAxisEnabled(!multiYAxisEnabled);
  };
  
  // Toggle logarithmic scale
  const toggleLogScale = async () => {
    const isLogScale = await toggleLogarithmicScale('plot-container', 'y');
    setLogScaleEnabled(isLogScale);
  };
  
  // Apply smoothing to a signal
  const applySmoothing = async (signal: string, windowSize: number, method: 'movingAverage' | 'exponential') => {
    if (!fileData) return;
    
    await applySmoothingToSignal('plot-container', signal, windowSize, method, fileData);
    
    setSmoothingOptions({
      enabled: true,
      signal,
      windowSize,
      method
    });
  };
  
  // Reset smoothing
  const resetSmoothing = async () => {
    if (!fileData || !smoothingOptions.enabled) return;
    
    // Reset to standard plot
    const plotData = generatePlotData(fileData, selectedSignals, {
      title: currentFile?.name || 'Signal Visualization',
      showLegend: true,
      lineWidth: 2
    }, primaryCursor, diffCursor);
    
    await updatePlot('plot-container', plotData);
    
    setSmoothingOptions({
      enabled: false,
      signal: '',
      windowSize: 5,
      method: 'movingAverage'
    });
  };
  
  // Handle clear derived signals
  const handleClearDerivedSignals = () => {
    setDerivedSignals({});
    
    // Remove derived signals from selected signals
    if (fileData) {
      const originalSignals = fileData.signals;
      setSelectedSignals(prev => prev.filter(signal => originalSignals.includes(signal)));
    }
  };
  
  // Handle remove derived signal
  const handleRemoveDerivedSignal = (signalName: string) => {
    setDerivedSignals(prev => {
      const newSignals = { ...prev };
      delete newSignals[signalName];
      return newSignals;
    });
    
    // Remove from selected signals
    setSelectedSignals(prev => prev.filter(signal => signal !== signalName));
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
                        value={signalFilter}
                        onChange={handleSignalFilterChange}
                      />
                      {signalFilter && (
                        <button
                          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setSignalFilter('')}
                        >
                          <X size={16} />
                        </button>
                      )}
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
                          signalFilter ? (
                            // Show flat list when filtering
                            getFilteredSignals().map((signal) => {
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
                            // Show grouped list when not filtering
                            Object.entries(signalGroups).map(([group, signals]) => (
                              <div key={group} className="mb-2">
                                <div 
                                  className="flex items-center justify-between py-1 px-1 bg-accent/20 rounded cursor-pointer"
                                  onClick={() => toggleGroupExpansion(group)}
                                >
                                  <span className="text-sm font-medium">{group} ({signals.length})</span>
                                  <button className="text-muted-foreground hover:text-foreground">
                                    {expandedGroups[group] ? (
                                      <ChevronDown size={16} />
                                    ) : (
                                      <ChevronRight size={16} />
                                    )}
                                  </button>
                                </div>
                                
                                {expandedGroups[group] && (
                                  <div className="pl-2 mt-1 space-y-1">
                                    {signals.map((signal) => (
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
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )
                        ) : (
                          <p className="text-xs text-muted-foreground">No file loaded</p>
                        )}
                        
                        {fileData && getFilteredSignals().length === 0 && (
                          <p className="text-xs text-muted-foreground">No signals match your search</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Derived Signals Section */}
                    {Object.keys(derivedSignals).length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <List size={14} />
                            <span>Derived Signals</span>
                          </h3>
                          <button 
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                            onClick={handleClearDerivedSignals}
                          >
                            Clear All
                          </button>
                        </div>
                        
                        <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto">
                          {Object.entries(derivedSignals).map(([name, signal]) => (
                            <div key={name} className="flex flex-col bg-accent/20 p-1 rounded mb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    id={`signal-${name}`}
                                    className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    checked={selectedSignals.includes(name)}
                                    onChange={(e) => handleSignalSelect(name, e.target.checked)}
                                  />
                                  <label
                                    htmlFor={`signal-${name}`}
                                    className="flex-1 text-sm cursor-pointer py-1"
                                    title={signal.metadata.description || name}
                                  >
                                    {name}
                                    <div className="text-xs text-muted-foreground">
                                      {signal.metadata.description || 'Derived signal'}
                                    </div>
                                  </label>
                                </div>
                                <button
                                  className="text-xs px-1 py-0.5 bg-red-500 text-white rounded"
                                  onClick={() => handleRemoveDerivedSignal(name)}
                                >
                                  Remove
                                </button>
                              </div>
                              
                              {/* Display statistics if available */}
                              {signal.metadata.statistics && (
                                <div className="mt-2">
                                  <StatisticsDisplay 
                                    statistics={signal.metadata.statistics} 
                                    signalName={name} 
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                className={`p-1 ${cursorMode === 'primary' ? 'bg-primary/20' : ''} ${primaryCursor.visible ? 'text-primary' : 'text-muted-foreground'} hover:text-primary/80 bg-background hover:bg-accent rounded-md`} 
                title="Primary Cursor"
                onClick={() => setCursorMode('primary')}
              >
                <Eye size={16} />
              </button>
              <button 
                className={`p-1 ${cursorMode === 'diff' ? 'bg-primary/20' : ''} ${diffCursor.visible ? 'text-blue-500' : 'text-muted-foreground'} hover:text-blue-500/80 bg-background hover:bg-accent rounded-md`} 
                title="Diff Cursor"
                onClick={() => setCursorMode('diff')}
              >
                <Eye size={16} color={diffCursor.visible ? 'rgba(0, 0, 255, 0.75)' : undefined} />
              </button>
              <button 
                className="p-1 text-muted-foreground hover:text-foreground bg-background hover:bg-accent rounded-md" 
                title="Clear Cursors"
                onClick={clearCursors}
              >
                <X size={16} />
              </button>
              <div className="h-4 border-r border-border mx-1"></div>
              <button 
                className={`p-1 ${brushSelectionEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} hover:text-foreground bg-background hover:bg-accent rounded-md`} 
                title={brushSelectionEnabled ? "Disable Brush Selection" : "Enable Brush Selection"}
                onClick={toggleBrushSelection}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
              </button>
              <button 
                className={`p-1 ${multiYAxisEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} hover:text-foreground bg-background hover:bg-accent rounded-md`} 
                title={multiYAxisEnabled ? "Disable Multi-Y Axis" : "Enable Multi-Y Axis"}
                onClick={toggleMultiYAxis}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <button 
                className={`p-1 ${logScaleEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} hover:text-foreground bg-background hover:bg-accent rounded-md`} 
                title={logScaleEnabled ? "Switch to Linear Scale" : "Switch to Log Scale"}
                onClick={toggleLogScale}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M3 12h18"></path>
                  <path d="M3 3l6 6"></path>
                  <path d="M3 9l12 12"></path>
                </svg>
              </button>
              <div className="relative">
                <button 
                  className={`p-1 ${smoothingOptions.enabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} hover:text-foreground bg-background hover:bg-accent rounded-md`} 
                  title="Signal Smoothing"
                  onClick={() => {
                    if (smoothingOptions.enabled) {
                      resetSmoothing();
                    } else {
                      // Show smoothing options dropdown
                      const dropdown = document.getElementById('smoothing-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21c1.5-2 2-4.5 2-7.5S5.5 8 4 6"></path>
                    <path d="M12 20c1.5-2 2-4.5 2-7.5S13.5 7 12 5"></path>
                    <path d="M20 19c1.5-2 2-4.5 2-7.5S21.5 7 20 5"></path>
                  </svg>
                </button>
                <div id="smoothing-dropdown" className="absolute left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10 hidden">
                  <div className="p-2">
                    <h4 className="text-xs font-medium mb-1">Signal Smoothing</h4>
                    <select 
                      className="w-full p-1 text-xs border border-border rounded-md mb-1"
                      value={smoothingOptions.signal}
                      onChange={(e) => setSmoothingOptions({...smoothingOptions, signal: e.target.value})}
                    >
                      <option value="">Select signal</option>
                      {selectedSignals.map(signal => (
                        <option key={signal} value={signal}>{signal}</option>
                      ))}
                    </select>
                    <div className="flex items-center mb-1">
                      <span className="text-xs mr-1">Window:</span>
                      <input 
                        type="number" 
                        min="3" 
                        max="21" 
                        step="2"
                        className="w-12 p-1 text-xs border border-border rounded-md"
                        value={smoothingOptions.windowSize}
                        onChange={(e) => setSmoothingOptions({...smoothingOptions, windowSize: parseInt(e.target.value) || 5})}
                      />
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-xs mr-1">Method:</span>
                      <select 
                        className="flex-1 p-1 text-xs border border-border rounded-md"
                        value={smoothingOptions.method}
                        onChange={(e) => setSmoothingOptions({...smoothingOptions, method: e.target.value as 'movingAverage' | 'exponential'})}
                      >
                        <option value="movingAverage">Moving Average</option>
                        <option value="exponential">Exponential</option>
                      </select>
                    </div>
                    <button 
                      className="w-full p-1 text-xs bg-primary text-primary-foreground rounded-md"
                      onClick={() => {
                        if (smoothingOptions.signal) {
                          applySmoothing(smoothingOptions.signal, smoothingOptions.windowSize, smoothingOptions.method);
                          const dropdown = document.getElementById('smoothing-dropdown');
                          if (dropdown) {
                            dropdown.classList.add('hidden');
                          }
                        }
                      }}
                      disabled={!smoothingOptions.signal}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {brushSelectionEnabled 
                ? 'Click and drag to select a region to zoom' 
                : cursorMode === 'primary' 
                  ? 'Click to position primary cursor' 
                  : 'Click to position diff cursor'} 
              {!brushSelectionEnabled && '• Shift+Click for diff cursor'}
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
          >
            <PlotArea
              plotData={plotData}
              isLoading={isLoading}
              fileData={fileData || undefined}
              selectedSignals={selectedSignals}
              primaryCursor={primaryCursor}
              diffCursor={diffCursor}
              onCursorMove={handleCursorMove}
            />
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
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a question about your data..."
                          className="flex-1 p-2 text-sm border border-border rounded-md min-h-[60px] resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(chatInput.trim());
                            }
                          }}
                        ></textarea>
                        <button 
                          className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          onClick={() => handleSendMessage(chatInput.trim())}
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
                        <button 
                          className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent rounded-full"
                          onClick={() => handleQuickSuggestion('What is the correlation between signals?')}
                        >
                          Correlation
                        </button>
                        <button 
                          className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent rounded-full"
                          onClick={() => handleQuickSuggestion('What are the values at the cursor position?')}
                        >
                          Cursor values
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
                                const unit = fileData.metadata?.units?.[signal] || '';
                                
                                return (
                                  <div key={signal} className="border-b border-border pb-2">
                                    <h4 className="text-sm font-medium">{signal}</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                      <span className="text-xs text-muted-foreground">Min:</span>
                                      <span className="text-xs">{min.toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                      <span className="text-xs text-muted-foreground">Max:</span>
                                      <span className="text-xs">{max.toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                      <span className="text-xs text-muted-foreground">Avg:</span>
                                      <span className="text-xs">{avg.toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                      <span className="text-xs text-muted-foreground">Range:</span>
                                      <span className="text-xs">{(max - min).toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {primaryCursor.visible && (
                            <div className="border border-border rounded-md p-3">
                              <h3 className="text-sm font-medium mb-2">Primary Cursor Values</h3>
                              <div className="text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span>{primaryCursor.x.toFixed(2)}s</span>
                                </div>
                                {Object.entries(cursorValues.primary).map(([signal, value]) => {
                                  const unit = fileData.metadata?.units?.[signal] || '';
                                  return (
                                    <div key={signal} className="flex justify-between mt-1">
                                      <span className="text-muted-foreground">{signal}:</span>
                                      <span>{value.toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {diffCursor.visible && (
                            <div className="border border-border rounded-md p-3 mt-3">
                              <h3 className="text-sm font-medium mb-2">Diff Cursor Values</h3>
                              <div className="text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span>{diffCursor.x.toFixed(2)}s</span>
                                </div>
                                {Object.entries(cursorValues.diff).map(([signal, value]) => {
                                  const unit = fileData.metadata?.units?.[signal] || '';
                                  return (
                                    <div key={signal} className="flex justify-between mt-1">
                                      <span className="text-muted-foreground">{signal}:</span>
                                      <span>{value.toFixed(2)}{unit ? ' ' + unit : ''}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {primaryCursor.visible && diffCursor.visible && (
                            <div className="border border-border rounded-md p-3 mt-3 bg-accent/10">
                              <h3 className="text-sm font-medium mb-2">Cursor Differences</h3>
                              <div className="text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time Difference:</span>
                                  <span>{Math.abs(primaryCursor.x - diffCursor.x).toFixed(2)}s</span>
                                </div>
                                {Object.entries(cursorValues.difference).map(([signal, value]) => {
                                  const unit = fileData.metadata?.units?.[signal] || '';
                                  return (
                                    <div key={signal} className="flex justify-between mt-1">
                                      <span className="text-muted-foreground">{signal}:</span>
                                      <span className={value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : ''}>
                                        {value > 0 ? '+' : ''}{value.toFixed(2)}{unit ? ' ' + unit : ''}
                                      </span>
                                    </div>
                                  );
                                })}
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
                    Position the cursor and click &quot;Add Note&quot; to create an annotation
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
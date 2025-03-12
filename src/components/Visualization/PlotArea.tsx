'use client';

import { useEffect, useRef, useState } from 'react';
import { PlotData, CursorData, createPlot, updatePlot, updateCursors, getCursorValues, debugPlotly } from '../../services/visualization';
import { FileData } from '../../services/file';

interface PlotAreaProps {
  plotData?: PlotData;
  isLoading?: boolean;
  fileData?: FileData;
  selectedSignals?: string[];
  primaryCursor?: CursorData;
  diffCursor?: CursorData;
  onCursorMove?: (x: number, isPrimary: boolean) => void;
}

export function PlotArea({ 
  plotData, 
  isLoading = false, 
  fileData,
  selectedSignals = [],
  primaryCursor,
  diffCursor,
  onCursorMove
}: PlotAreaProps) {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [plotInitialized, setPlotInitialized] = useState(false);
  const [primaryValues, setPrimaryValues] = useState<Record<string, number>>({});
  const [diffValues, setDiffValues] = useState<Record<string, number>>({});
  
  // Initialize or update the plot when plotData changes
  useEffect(() => {
    if (plotData && plotContainerRef.current) {
      const containerId = 'plot-container';
      
      if (!plotInitialized) {
        // Initialize the plot
        createPlot(containerId, plotData)
          .then(() => {
            setPlotInitialized(true);
            console.log('Plot initialized successfully');
            
            // Debug Plotly after initialization
            setTimeout(() => {
              console.log('Running Plotly debug after initialization');
              debugPlotly(containerId);
            }, 500);
          })
          .catch((error: Error) => {
            console.error('Error creating plot:', error);
          });
      } else {
        // Update the plot
        updatePlot(containerId, plotData)
          .then(() => {
            console.log('Plot updated successfully');
            // Debug Plotly after update
            setTimeout(() => {
              console.log('Running Plotly debug after update');
              debugPlotly(containerId);
            }, 500);
          })
          .catch((error: Error) => {
            console.error('Error updating plot:', error);
          });
      }
    }
  }, [plotData, plotInitialized]);
  
  // Attach event listeners to Plotly elements - in a separate useEffect to avoid infinite loops
  useEffect(() => {
    if (plotInitialized && plotContainerRef.current) {
      console.log('===== ATTACHING PLOT EVENT LISTENERS =====');
      
      // Get the plot container
      const container = document.getElementById('plot-container');
      if (!container) {
        console.error('Plot container not found');
        return;
      }
      
      // Function to handle mousedown events
      const handleMouseDown = (event: Event) => {
        handlePlotMouseDown(event as MouseEvent);
      };
      
      // Find all drag elements within the plot
      const dragElements = container.querySelectorAll('.nsewdrag');
      console.log(`Found ${dragElements.length} drag elements in plot`);
      
      // Attach mousedown event to each drag element
      dragElements.forEach((element, index) => {
        element.addEventListener('mousedown', handleMouseDown);
        console.log(`Attached mousedown listener to drag element ${index}`);
      });
      
      // Also attach to the main plot element as a fallback
      container.addEventListener('mousedown', handleMouseDown);
      console.log('Attached mousedown listener to main plot container');
      
      console.log('===== FINISHED ATTACHING PLOT EVENT LISTENERS =====');
      
      // Clean up function to remove event listeners
      return () => {
        console.log('Cleaning up plot event listeners');
        if (container) {
          container.removeEventListener('mousedown', handleMouseDown);
          
          dragElements.forEach(element => {
            element.removeEventListener('mousedown', handleMouseDown);
          });
        }
      };
    }
  }, [plotInitialized]); // Only re-run when plotInitialized changes
  
  // Update cursors when they change
  useEffect(() => {
    if (plotInitialized && (primaryCursor || diffCursor)) {
      updateCursors('plot-container', primaryCursor, diffCursor)
        .catch((error: Error) => {
          console.error('Error updating cursors:', error);
        });
    }
  }, [primaryCursor, diffCursor, plotInitialized]);
  
  // Update cursor values when cursors or data change
  useEffect(() => {
    if (fileData && selectedSignals) {
      if (primaryCursor?.visible) {
        try {
          const values = getCursorValues(fileData, selectedSignals, primaryCursor.x);
          setPrimaryValues(values);
        } catch (error) {
          console.error('Error getting primary cursor values:', error);
        }
      } else {
        setPrimaryValues({});
      }
      
      if (diffCursor?.visible) {
        try {
          const values = getCursorValues(fileData, selectedSignals, diffCursor.x);
          setDiffValues(values);
        } catch (error) {
          console.error('Error getting diff cursor values:', error);
        }
      } else {
        setDiffValues({});
      }
    }
  }, [fileData, selectedSignals, primaryCursor?.visible, primaryCursor?.x, diffCursor?.visible, diffCursor?.x]);
  
  // Handle plot mousedown for cursor positioning
  const handlePlotMouseDown = (event: MouseEvent) => {
    if (!plotContainerRef.current || !onCursorMove) {
      console.log('Plot container ref or onCursorMove callback not available');
      return;
    }
    
    console.log('===== PLOT MOUSEDOWN EVENT =====');
    console.log('Event details:', {
      clientX: event.clientX,
      clientY: event.clientY,
      shiftKey: event.shiftKey,
      target: event.target,
      targetTagName: (event.target as HTMLElement).tagName,
      targetClassName: (event.target as HTMLElement).className
    });
    
    // Check if we're clicking on the plot area or a UI element
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
      console.log('Clicked on a button or button child, ignoring for cursor positioning');
      return;
    }
    
    try {
      // Get the plot container and its dimensions
      const plotElement = document.getElementById('plot-container');
      if (!plotElement) {
        console.error('Plot container element not found');
        return;
      }
      
      console.log('Plot element found:', {
        id: plotElement.id,
        className: plotElement.className,
        childElementCount: plotElement.childElementCount
      });
      
      const rect = plotElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      console.log(`Click detected at pixel coordinates: x=${x}, y=${y}`);
      console.log('Plot container rect:', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      
      // Try to get the Plotly layout to use its conversion functions
      // @ts-ignore - Accessing Plotly's internal properties
      const plotlyLayout = plotElement._fullLayout;
      
      if (plotlyLayout && plotlyLayout.xaxis && plotlyLayout.xaxis.p2d) {
        // Use Plotly's built-in conversion function
        // First, we need to adjust for the plot's margins
        const margin = plotlyLayout.margin || { l: 80, r: 20, t: 80, b: 80 };
        
        // Calculate the position relative to the actual plotting area
        const plotX = x - margin.l;
        
        // Convert pixel to data coordinates using Plotly's function
        const xData = plotlyLayout.xaxis.p2d(plotX);
        
        console.log('Using Plotly conversion:', {
          margins: margin,
          plotX,
          xData
        });
        
        const isPrimary = !event.shiftKey;
        
        // Only process clicks within the actual plot area
        if (plotX >= 0 && plotX <= (rect.width - margin.l - margin.r)) {
          console.log(`Calling onCursorMove with:`, {
            xData,
            isPrimary
          });
          
          onCursorMove(xData, isPrimary);
        } else {
          console.log('Click outside of plot data area, ignoring');
        }
      } 
      // Fallback to direct calculation if Plotly's conversion is not available
      else if (fileData && fileData.data.time && fileData.data.time.length > 0) {
        const xMin = fileData.data.time[0];
        const xMax = fileData.data.time[fileData.data.time.length - 1];
        const xRange = xMax - xMin;
        
        // Use a more accurate estimate of the plot margins
        const plotArea = {
          left: 80, // Default left margin
          right: 20, // Default right margin
        };
        
        const plotWidth = rect.width - plotArea.left - plotArea.right;
        const xRelative = x - plotArea.left;
        
        console.log('Plot area calculations (fallback):', {
          plotAreaLeft: plotArea.left,
          plotAreaRight: plotArea.right,
          plotWidth,
          xRelative,
          clickX: x
        });
        
        // Only process clicks within the actual plot area
        if (xRelative >= 0 && xRelative <= plotWidth) {
          // Calculate the data position
          const xPos = xMin + (xRelative / plotWidth) * xRange;
          
          const isPrimary = !event.shiftKey;
          console.log(`Using direct calculation: Click at x=${x}px (relative: ${xRelative}px), converted to data x=${xPos}, isPrimary=${isPrimary}`);
          console.log('Calculation details:', {
            xMin,
            xMax,
            xRange,
            plotWidth,
            ratio: xRelative / plotWidth,
            calculatedXPos: xPos
          });
          
          // Call the callback with the cursor position
          console.log('Calling onCursorMove with:', {
            xData: xPos,
            isPrimary
          });
          
          onCursorMove(xPos, isPrimary);
        } else {
          console.log('Click outside of plot data area, ignoring');
        }
      } else {
        console.error('Cannot determine data coordinates - no time data available');
        console.log('FileData details:', {
          hasFileData: !!fileData,
          hasTimeData: fileData ? !!fileData.data.time : false,
          timeDataLength: fileData && fileData.data.time ? fileData.data.time.length : 0
        });
      }
    } catch (error) {
      console.error('Error handling plot click:', error);
      console.log('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
    console.log('===== END PLOT MOUSEDOWN EVENT =====');
  };
  
  // Reset the plot initialization state when the component unmounts
  useEffect(() => {
    return () => {
      setPlotInitialized(false);
    };
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading plot...</span>
          </div>
        ) : !plotData ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p>No data to display. Please load a file to visualize data.</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div 
              id="plot-container" 
              ref={plotContainerRef} 
              className="w-full h-full"
              style={{ cursor: 'crosshair' }}
            ></div>
            
            {/* Cursor Values Display */}
            {(primaryCursor?.visible || diffCursor?.visible) && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primary Cursor Values */}
                  {primaryCursor?.visible && (
                    <div className="col-span-1">
                      <h4 className="font-medium text-red-600 mb-1">Primary Cursor</h4>
                      <p className="text-slate-600 mb-1">Time: {primaryCursor.x.toFixed(4)}s</p>
                      <div className="max-h-32 overflow-y-auto">
                        {Object.entries(primaryValues).length > 0 ? (
                          Object.entries(primaryValues).map(([signal, value]) => (
                            <div key={`primary-${signal}`} className="flex justify-between mb-1">
                              <span className="text-slate-700">{signal}:</span>
                              <span className="font-mono">{value.toFixed(4)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 italic">No values available</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Diff Cursor Values */}
                  {diffCursor?.visible && (
                    <div className="col-span-1">
                      <h4 className="font-medium text-blue-600 mb-1">Diff Cursor</h4>
                      <p className="text-slate-600 mb-1">Time: {diffCursor.x.toFixed(4)}s</p>
                      <div className="max-h-32 overflow-y-auto">
                        {Object.entries(diffValues).length > 0 ? (
                          Object.entries(diffValues).map(([signal, value]) => (
                            <div key={`diff-${signal}`} className="flex justify-between mb-1">
                              <span className="text-slate-700">{signal}:</span>
                              <span className="font-mono">{value.toFixed(4)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 italic">No values available</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Difference Values */}
                  {primaryCursor?.visible && diffCursor?.visible && (
                    <div className="col-span-1">
                      <h4 className="font-medium text-purple-600 mb-1">Difference</h4>
                      <p className="text-slate-600 mb-1">ΔTime: {(diffCursor.x - primaryCursor.x).toFixed(4)}s</p>
                      <div className="max-h-32 overflow-y-auto">
                        {Object.entries(diffValues).length > 0 ? (
                          Object.entries(diffValues).map(([signal, value]) => {
                            const primaryValue = primaryValues[signal] || 0;
                            const diff = value - primaryValue;
                            return (
                              <div key={`diff-${signal}`} className="flex justify-between mb-1">
                                <span className="text-slate-700">{signal}:</span>
                                <span className={`font-mono ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>
                                  {diff.toFixed(4)}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-slate-500 italic">No values available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
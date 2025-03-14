'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  PlotData, 
  CursorData, 
  createPlot, 
  updatePlot, 
  updateCursors, 
  getCursorValues, 
  debugPlotly,
  convertTo3D,
  createHeatmap,
  addRangeSelector,
  addAnnotations,
  applyTheme,
  enableEnhancedTooltips,
  createContourPlot,
  PlotAnnotation
} from '../../services/visualization';
import { FileData } from '../../services/file';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  Grid3X3, 
  Layers, 
  Palette, 
  SunMoon, 
  Thermometer, 
  Box, 
  Maximize, 
  MessageSquare, 
  Sliders,
  X
} from 'lucide-react';

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
  
  // New state for visualization options
  const [visualizationType, setVisualizationType] = useState<'line' | '3d' | 'heatmap' | 'contour'>('line');
  const [theme, setTheme] = useState<'light' | 'dark' | 'custom'>('light');
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [enhancedTooltips, setEnhancedTooltips] = useState(false);
  const [annotations, setAnnotations] = useState<PlotAnnotation[]>([]);
  const [newAnnotation, setNewAnnotation] = useState<{text: string, x: number}>({text: '', x: 0});
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  
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
  
  // Handle visualization type change
  const handleVisualizationChange = async (type: 'line' | '3d' | 'heatmap' | 'contour') => {
    if (!fileData || !plotInitialized || selectedSignals.length === 0) {
      console.log('Cannot change visualization type: missing data or plot not initialized');
      return;
    }
    
    setVisualizationType(type);
    
    try {
      const containerId = 'plot-container';
      
      if (type === 'line') {
        // Revert to standard line plot
        if (plotData) {
          await updatePlot(containerId, plotData);
        }
      } else if (type === '3d') {
        // Convert to 3D visualization
        await convertTo3D(containerId, fileData, selectedSignals);
      } else if (type === 'heatmap') {
        // Create heatmap visualization
        await createHeatmap(containerId, fileData, selectedSignals);
      } else if (type === 'contour') {
        // Create contour visualization
        await createContourPlot(containerId, fileData, selectedSignals);
      }
      
      // Re-apply other settings if needed
      if (showRangeSelector && type === 'line') {
        await addRangeSelector(containerId);
      }
      
      if (enhancedTooltips) {
        await enableEnhancedTooltips(containerId, fileData);
      }
      
      if (annotations.length > 0 && type === 'line') {
        await addAnnotations(containerId, annotations);
      }
    } catch (error) {
      console.error(`Error changing visualization to ${type}:`, error);
    }
  };
  
  // Handle theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'custom') => {
    if (!plotInitialized) {
      console.log('Cannot change theme: plot not initialized');
      return;
    }
    
    setTheme(newTheme);
    
    try {
      await applyTheme('plot-container', newTheme);
    } catch (error) {
      console.error(`Error applying theme ${newTheme}:`, error);
    }
  };
  
  // Toggle range selector
  const handleToggleRangeSelector = async () => {
    if (!plotInitialized || visualizationType !== 'line') {
      console.log('Cannot toggle range selector: plot not initialized or not in line mode');
      return;
    }
    
    const newValue = !showRangeSelector;
    setShowRangeSelector(newValue);
    
    try {
      if (newValue) {
        await addRangeSelector('plot-container');
      } else {
        // Remove range selector by updating the plot
        if (plotData) {
          await updatePlot('plot-container', plotData);
          
          // Re-apply other settings
          if (annotations.length > 0) {
            await addAnnotations('plot-container', annotations);
          }
          
          if (enhancedTooltips && fileData) {
            await enableEnhancedTooltips('plot-container', fileData);
          }
        }
      }
    } catch (error) {
      console.error(`Error ${newValue ? 'adding' : 'removing'} range selector:`, error);
    }
  };
  
  // Toggle enhanced tooltips
  const handleToggleEnhancedTooltips = async () => {
    if (!plotInitialized || !fileData) {
      console.log('Cannot toggle enhanced tooltips: plot not initialized or no file data');
      return;
    }
    
    const newValue = !enhancedTooltips;
    setEnhancedTooltips(newValue);
    
    try {
      if (newValue) {
        await enableEnhancedTooltips('plot-container', fileData);
      } else {
        // Reset tooltips by updating the plot
        if (plotData) {
          await updatePlot('plot-container', plotData);
          
          // Re-apply other settings
          if (showRangeSelector) {
            await addRangeSelector('plot-container');
          }
          
          if (annotations.length > 0) {
            await addAnnotations('plot-container', annotations);
          }
        }
      }
    } catch (error) {
      console.error(`Error ${newValue ? 'enabling' : 'disabling'} enhanced tooltips:`, error);
    }
  };
  
  // Add annotation
  const handleAddAnnotation = async () => {
    if (!plotInitialized || visualizationType !== 'line' || !newAnnotation.text) {
      console.log('Cannot add annotation: plot not initialized, not in line mode, or no text');
      return;
    }
    
    // Create new annotation
    const annotation: PlotAnnotation = {
      text: newAnnotation.text,
      x: newAnnotation.x || (primaryCursor?.visible ? primaryCursor.x : 0),
      y: 0.5,
      yref: 'paper',
      showarrow: true
    };
    
    // Update annotations state
    const updatedAnnotations = [...annotations, annotation];
    setAnnotations(updatedAnnotations);
    
    // Reset new annotation form
    setNewAnnotation({text: '', x: 0});
    setIsAddingAnnotation(false);
    
    try {
      // Apply annotations to plot
      await addAnnotations('plot-container', updatedAnnotations);
    } catch (error) {
      console.error('Error adding annotation:', error);
    }
  };
  
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
  
  // Add event listener for plot mousedown
  useEffect(() => {
    const plotContainer = document.getElementById('plot-container');
    if (plotContainer && onCursorMove) {
      plotContainer.addEventListener('mousedown', handlePlotMouseDown);
      
      return () => {
        plotContainer.removeEventListener('mousedown', handlePlotMouseDown);
      };
    }
  }, [plotInitialized, fileData, onCursorMove]);
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Visualization Controls */}
      {plotInitialized && !isLoading && plotData && (
        <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
          <Tabs defaultValue="type" className="w-full">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="type">Plot Type</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="annotations">Annotations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="type" className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={visualizationType === 'line' ? 'default' : 'outline'}
                  onClick={() => handleVisualizationChange('line')}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Line
                </Button>
                <Button 
                  size="sm" 
                  variant={visualizationType === '3d' ? 'default' : 'outline'}
                  onClick={() => handleVisualizationChange('3d')}
                  disabled={!selectedSignals || selectedSignals.length < 2}
                >
                  <Box className="h-4 w-4 mr-1" />
                  3D
                </Button>
                <Button 
                  size="sm" 
                  variant={visualizationType === 'heatmap' ? 'default' : 'outline'}
                  onClick={() => handleVisualizationChange('heatmap')}
                  disabled={!selectedSignals || selectedSignals.length < 1}
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Heatmap
                </Button>
                <Button 
                  size="sm" 
                  variant={visualizationType === 'contour' ? 'default' : 'outline'}
                  onClick={() => handleVisualizationChange('contour')}
                  disabled={!selectedSignals || selectedSignals.length < 1}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Contour
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                >
                  <SunMoon className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button 
                  size="sm" 
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                >
                  <SunMoon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToggleEnhancedTooltips()}
                  className={enhancedTooltips ? 'bg-blue-100' : ''}
                >
                  <Thermometer className="h-4 w-4 mr-1" />
                  Enhanced Tooltips
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToggleRangeSelector()}
                  className={showRangeSelector ? 'bg-blue-100' : ''}
                  disabled={visualizationType !== 'line'}
                >
                  <Sliders className="h-4 w-4 mr-1" />
                  Range Selector
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="annotations" className="space-y-2">
              {isAddingAnnotation ? (
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    placeholder="Annotation text"
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                    value={newAnnotation.text}
                    onChange={(e) => setNewAnnotation({...newAnnotation, text: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={handleAddAnnotation}
                      disabled={!newAnnotation.text}
                    >
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setIsAddingAnnotation(false);
                        setNewAnnotation({text: '', x: 0});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsAddingAnnotation(true)}
                    disabled={visualizationType !== 'line'}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Add Annotation
                  </Button>
                </div>
              )}
              
              {annotations.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium mb-1 text-slate-500">Current Annotations</h4>
                  <div className="max-h-24 overflow-y-auto">
                    {annotations.map((annotation, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                        <span className="truncate mr-2">{annotation.text}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newAnnotations = annotations.filter((_, i) => i !== index);
                            setAnnotations(newAnnotations);
                            addAnnotations('plot-container', newAnnotations).catch(console.error);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
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
                      <p className="text-slate-600 mb-1">ΔTime: {Math.abs(primaryCursor.x - diffCursor.x).toFixed(4)}s</p>
                      <div className="max-h-32 overflow-y-auto">
                        {Object.keys(primaryValues).length > 0 && Object.keys(diffValues).length > 0 ? (
                          Object.keys(primaryValues).map(signal => {
                            if (diffValues[signal] !== undefined) {
                              const diff = primaryValues[signal] - diffValues[signal];
                              return (
                                <div key={`diff-${signal}`} className="flex justify-between mb-1">
                                  <span className="text-slate-700">{signal}:</span>
                                  <span className="font-mono">{diff.toFixed(4)}</span>
                                </div>
                              );
                            }
                            return null;
                          }).filter(Boolean)
                        ) : (
                          <p className="text-slate-500 italic">No difference values available</p>
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
/**
 * Visualization service for handling plotting and data visualization
 */
import Plotly from 'plotly.js-dist-min';
import { FileData } from './file';

export interface PlotConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  colorScale?: string;
  lineWidth?: number;
  markerSize?: number;
}

export interface CursorData {
  x: number;
  visible: boolean;
  color: string;
  label?: string;
}

export interface PlotData {
  data: any[]; // Using any instead of Plotly.Data
  layout: any; // Using any instead of Partial<Plotly.Layout>
  config: any; // Using any instead of Partial<Plotly.Config>
  primaryCursor?: CursorData;
  diffCursor?: CursorData;
}

const DEFAULT_CONFIG: PlotConfig = {
  title: 'Signal Visualization',
  xAxisLabel: 'Time',
  yAxisLabel: 'Value',
  showLegend: true,
  colorScale: 'Viridis',
  lineWidth: 2,
  markerSize: 6
};

const DEFAULT_PRIMARY_CURSOR: CursorData = {
  x: 0,
  visible: false,
  color: 'rgba(255, 0, 0, 0.75)',
  label: 'Primary'
};

const DEFAULT_DIFF_CURSOR: CursorData = {
  x: 0,
  visible: false,
  color: 'rgba(0, 0, 255, 0.75)',
  label: 'Diff'
};

/**
 * Generate plot data from file data
 * @param {FileData} fileData - The file data to visualize
 * @param {string[]} selectedSignals - The signals to include in the visualization
 * @param {PlotConfig} config - Configuration options for the plot
 * @param {CursorData} primaryCursor - Primary cursor data
 * @param {CursorData} diffCursor - Differential cursor data
 * @returns {PlotData} The plot data
 */
export function generatePlotData(
  fileData: FileData,
  selectedSignals: string[] = [],
  config: Partial<PlotConfig> = {},
  primaryCursor?: CursorData,
  diffCursor?: CursorData
): PlotData {
  // Merge config with defaults
  const plotConfig = { ...DEFAULT_CONFIG, ...config };
  
  // If no signals are selected, use all signals except time
  let signalsToPlot = selectedSignals.length > 0
    ? selectedSignals
    : fileData.signals.filter(s => s !== 'time');
  
  // Ensure we have a time axis
  let timeAxis: number[] = [];
  
  // Check if time is in the data
  if (fileData.data.time && Array.isArray(fileData.data.time)) {
    timeAxis = fileData.data.time;
  } else {
    // Generate time axis if not present in data
    const maxLength = Math.max(...signalsToPlot.map(s => fileData.data[s]?.length || 0));
    timeAxis = Array.from({ length: maxLength }, (_, i) => i);
  }
  
  // Generate traces for each signal
  const traces = signalsToPlot.map((signal, index) => {
    if (!fileData.data[signal] || !Array.isArray(fileData.data[signal])) {
      console.warn(`Signal ${signal} is not an array or is missing`);
      return null;
    }
    
    const values = fileData.data[signal];
    
    return {
      x: timeAxis.slice(0, values.length),
      y: values,
      type: 'scatter',
      mode: 'lines',
      name: signal,
      line: {
        width: plotConfig.lineWidth,
        color: getColor(index, signalsToPlot.length, plotConfig.colorScale)
      },
      marker: {
        size: plotConfig.markerSize
      }
    };
  }).filter(trace => trace !== null);
  
  // Generate layout
  const layout: any = { // Using any instead of Partial<Plotly.Layout>
    title: plotConfig.title,
    xaxis: {
      title: plotConfig.xAxisLabel,
      autorange: true
    },
    yaxis: {
      title: plotConfig.yAxisLabel,
      autorange: true
    },
    showlegend: plotConfig.showLegend,
    autosize: true,
    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
    hovermode: 'closest'
  };
  
  // Generate config
  const plotlyConfig: any = { // Using any instead of Partial<Plotly.Config>
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false
  };
  
  return {
    data: traces,
    layout,
    config: plotlyConfig,
    primaryCursor,
    diffCursor
  };
}

/**
 * Create a plot in the specified container
 * @param {string} containerId - The ID of the container element
 * @param {PlotData} plotData - The plot data
 * @returns {Promise<any>} The plot element
 */
export async function createPlot(
  containerId: string,
  plotData: PlotData
): Promise<any> { // Using any instead of Plotly.PlotlyHTMLElement
  console.log('===== CREATE PLOT =====');
  console.log('createPlot called with containerId:', containerId);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    console.log('Available elements with IDs:', 
      Array.from(document.querySelectorAll('[id]')).map(el => el.id)
    );
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  console.log('Container element found:', {
    id: container.id,
    tagName: container.tagName,
    className: container.className,
    childElementCount: container.childElementCount
  });
  
  console.log('Creating new plot with data:', {
    traces: plotData.data.length,
    primaryCursor: plotData.primaryCursor ? 
      `x=${plotData.primaryCursor.x}, visible=${plotData.primaryCursor.visible}` : 'none',
    diffCursor: plotData.diffCursor ? 
      `x=${plotData.diffCursor.x}, visible=${plotData.diffCursor.visible}` : 'none'
  });
  
  // Log trace details
  console.log('Trace details:');
  plotData.data.forEach((trace, index) => {
    console.log(`Trace ${index}:`, {
      name: trace.name,
      type: trace.type,
      mode: trace.mode,
      xLength: Array.isArray(trace.x) ? trace.x.length : 'not an array',
      yLength: Array.isArray(trace.y) ? trace.y.length : 'not an array',
      xRange: Array.isArray(trace.x) ? `${Math.min(...trace.x)} to ${Math.max(...trace.x)}` : 'N/A',
      yRange: Array.isArray(trace.y) ? `${Math.min(...trace.y)} to ${Math.max(...trace.y)}` : 'N/A'
    });
  });
  
  // Add shapes for cursors if they exist
  const layout = { ...plotData.layout };
  console.log('Original layout:', layout);
  
  // Initialize shapes array if it doesn't exist
  layout.shapes = layout.shapes || [];
  
  // Add primary cursor if visible
  if (plotData.primaryCursor?.visible) {
    const primaryShape = {
      type: 'line',
      x0: plotData.primaryCursor.x,
      y0: 0,
      x1: plotData.primaryCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: plotData.primaryCursor.color,
        width: 2,
        dash: 'solid'
      }
    };
    layout.shapes.push(primaryShape);
    console.log(`Added primary cursor shape at x=${plotData.primaryCursor.x}:`, primaryShape);
  }
  
  // Add diff cursor if visible
  if (plotData.diffCursor?.visible) {
    const diffShape = {
      type: 'line',
      x0: plotData.diffCursor.x,
      y0: 0,
      x1: plotData.diffCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: plotData.diffCursor.color,
        width: 2,
        dash: 'dash'
      }
    };
    layout.shapes.push(diffShape);
    console.log(`Added diff cursor shape at x=${plotData.diffCursor.x}:`, diffShape);
  }
  
  // Ensure the plot is interactive
  const config = {
    ...plotData.config,
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    scrollZoom: true,
    editable: false
  };
  
  console.log('Final layout for plot:', {
    ...layout,
    shapes: layout.shapes.length
  });
  console.log('Plot config:', config);
  
  try {
    console.log('Calling Plotly.newPlot');
    const plot = await Plotly.newPlot(
      container,
      plotData.data,
      layout,
      config
    );
    
    console.log('Plot created successfully');
    
    // Check if the plot was created with the expected properties
    const plotElement = container as any;
    console.log('Plot element after creation:', {
      hasData: !!plotElement.data,
      dataLength: plotElement.data ? plotElement.data.length : 0,
      hasFullLayout: !!plotElement._fullLayout,
      hasShapes: plotElement._fullLayout ? !!plotElement._fullLayout.shapes : false,
      shapesCount: plotElement._fullLayout && plotElement._fullLayout.shapes ? plotElement._fullLayout.shapes.length : 0
    });
    
    // Add event listeners for debugging
    container.addEventListener('click', (e) => {
      console.log('Plot container click event:', {
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target
      });
    });
    
    console.log('===== END CREATE PLOT =====');
    return plot;
  } catch (error) {
    console.error('Error in Plotly.newPlot:', error);
    console.log('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    console.log('===== END CREATE PLOT (WITH ERROR) =====');
    throw error;
  }
}

/**
 * Update an existing plot
 * @param {string} containerId - The ID of the container element
 * @param {PlotData} plotData - The updated plot data
 * @returns {Promise<any>} The updated plot element
 */
export async function updatePlot(
  containerId: string,
  plotData: PlotData
): Promise<any> { // Using any instead of Plotly.PlotlyHTMLElement
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  console.log('Updating plot with data:', {
    traces: plotData.data.length,
    primaryCursor: plotData.primaryCursor ? 
      `x=${plotData.primaryCursor.x}, visible=${plotData.primaryCursor.visible}` : 'none',
    diffCursor: plotData.diffCursor ? 
      `x=${plotData.diffCursor.x}, visible=${plotData.diffCursor.visible}` : 'none'
  });
  
  // Add shapes for cursors if they exist
  const layout = { ...plotData.layout };
  
  // Initialize shapes array if it doesn't exist
  layout.shapes = layout.shapes || [];
  
  // Add primary cursor if visible
  if (plotData.primaryCursor?.visible) {
    layout.shapes.push({
      type: 'line',
      x0: plotData.primaryCursor.x,
      y0: 0,
      x1: plotData.primaryCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: plotData.primaryCursor.color,
        width: 2,
        dash: 'solid'
      }
    });
    console.log(`Added primary cursor shape at x=${plotData.primaryCursor.x}`);
  }
  
  // Add diff cursor if visible
  if (plotData.diffCursor?.visible) {
    layout.shapes.push({
      type: 'line',
      x0: plotData.diffCursor.x,
      y0: 0,
      x1: plotData.diffCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: plotData.diffCursor.color,
        width: 2,
        dash: 'dash'
      }
    });
    console.log(`Added diff cursor shape at x=${plotData.diffCursor.x}`);
  }
  
  // Ensure the plot is interactive
  const config = {
    ...plotData.config,
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    scrollZoom: true,
    editable: false
  };
  
  try {
    console.log('Calling Plotly.react');
    const plot = await Plotly.react(
      container,
      plotData.data,
      layout,
      config
    );
    
    console.log('Plot updated successfully');
    return plot;
  } catch (error) {
    console.error('Error in Plotly.react:', error);
    
    // Fallback to newPlot if react fails
    try {
      console.log('Falling back to Plotly.newPlot');
      return await Plotly.newPlot(
        container,
        plotData.data,
        layout,
        config
      );
    } catch (fallbackError) {
      console.error('Fallback to Plotly.newPlot also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Zoom in on the plot
 * @param {string} containerId - The ID of the container element
 * @param {number} factor - The zoom factor (default: 0.5)
 */
export function zoomIn(containerId: string, factor: number = 0.5): void {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  const currentRange = (container as any)._fullLayout.xaxis.range;
  const currentSpan = currentRange[1] - currentRange[0];
  const newSpan = currentSpan * factor;
  const center = (currentRange[0] + currentRange[1]) / 2;
  
  Plotly.relayout(container, {
    'xaxis.range': [
      center - newSpan / 2,
      center + newSpan / 2
    ]
  });
}

/**
 * Zoom out on the plot
 * @param {string} containerId - The ID of the container element
 * @param {number} factor - The zoom factor (default: 2)
 */
export function zoomOut(containerId: string, factor: number = 2): void {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  const currentRange = (container as any)._fullLayout.xaxis.range;
  const currentSpan = currentRange[1] - currentRange[0];
  const newSpan = currentSpan * factor;
  const center = (currentRange[0] + currentRange[1]) / 2;
  
  Plotly.relayout(container, {
    'xaxis.range': [
      center - newSpan / 2,
      center + newSpan / 2
    ]
  });
}

/**
 * Reset the plot zoom
 * @param {string} containerId - The ID of the container element
 */
export function resetZoom(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  Plotly.relayout(container, {
    'xaxis.autorange': true,
    'yaxis.autorange': true
  });
}

/**
 * Get a color from a color scale
 * @param {number} index - The index in the color scale
 * @param {number} total - The total number of colors needed
 * @param {string} colorScale - The name of the color scale
 * @returns {string} The color as a CSS string
 */
function getColor(index: number, total: number, colorScale?: string): string {
  // Simple implementation for a few basic color scales
  const scales: Record<string, string[]> = {
    'Viridis': [
      '#440154', '#482878', '#3e4989', '#31688e', '#26828e',
      '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'
    ],
    'Plasma': [
      '#0d0887', '#41049d', '#6a00a8', '#8f0da4', '#b12a90',
      '#cc4778', '#e16462', '#f2844b', '#fca636', '#fcce25'
    ],
    'Inferno': [
      '#000004', '#160b39', '#420a68', '#6a176e', '#932667',
      '#bc3754', '#dd513a', '#f37819', '#fca50a', '#f0f921'
    ],
    'Rainbow': [
      '#6e40aa', '#bf3caf', '#fe4b83', '#ff7847', '#e2b72f',
      '#aff05b', '#52f667', '#1ddfa3', '#23abd8', '#4c6edb'
    ]
  };
  
  // Default to Viridis if the specified color scale doesn't exist
  const scale = scales[colorScale || 'Viridis'] || scales['Viridis'];
  
  // Calculate the position in the scale
  const position = total <= 1 ? 0 : index / (total - 1);
  const scaledPosition = Math.min(Math.max(position, 0), 1);
  const colorIndex = Math.floor(scaledPosition * (scale.length - 1));
  
  return scale[colorIndex];
}

/**
 * Add or update cursors on the plot
 * @param {string} containerId - The ID of the container element
 * @param {CursorData} primaryCursor - Primary cursor data
 * @param {CursorData} diffCursor - Differential cursor data
 * @param {number[]} timeAxis - The time axis values
 * @returns {Promise<void>}
 */
export async function updateCursors(
  containerId: string,
  primaryCursor?: CursorData,
  diffCursor?: CursorData,
  timeAxis?: number[]
): Promise<void> {
  console.log('===== UPDATE CURSORS =====');
  console.log('updateCursors called with:', {
    containerId,
    primaryCursor: primaryCursor ? { ...primaryCursor } : 'undefined',
    diffCursor: diffCursor ? { ...diffCursor } : 'undefined',
    hasTimeAxis: Array.isArray(timeAxis)
  });

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    console.log('Available elements with IDs:', 
      Array.from(document.querySelectorAll('[id]')).map(el => el.id)
    );
    throw new Error(`Container element with ID "${containerId}" not found`);
  }

  console.log('Container element found:', {
    id: container.id,
    tagName: container.tagName,
    className: container.className,
    childElementCount: container.childElementCount
  });

  // Check if Plotly is available on the container
  const hasPlotlyData = !!(container as any)._fullLayout;
  console.log('Container has Plotly data:', hasPlotlyData);
  if (hasPlotlyData) {
    console.log('Plotly layout details:', {
      hasXaxis: !!(container as any)._fullLayout.xaxis,
      hasShapes: !!(container as any)._fullLayout.shapes,
      shapesCount: (container as any)._fullLayout.shapes ? (container as any)._fullLayout.shapes.length : 0
    });
  }

  // Create shapes array for cursors
  const shapes: any[] = [];

  // Add primary cursor if visible
  if (primaryCursor?.visible) {
    const primaryShape = {
      type: 'line',
      x0: primaryCursor.x,
      y0: 0,
      x1: primaryCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: primaryCursor.color,
        width: 2,
        dash: 'solid'
      }
    };
    shapes.push(primaryShape);
    console.log(`Adding primary cursor shape at x=${primaryCursor.x}:`, primaryShape);
  } else {
    console.log('Primary cursor not visible, not adding shape');
  }

  // Add diff cursor if visible
  if (diffCursor?.visible) {
    const diffShape = {
      type: 'line',
      x0: diffCursor.x,
      y0: 0,
      x1: diffCursor.x,
      y1: 1,
      yref: 'paper',
      line: {
        color: diffCursor.color,
        width: 2,
        dash: 'dash'
      }
    };
    shapes.push(diffShape);
    console.log(`Adding diff cursor shape at x=${diffCursor.x}:`, diffShape);
  } else {
    console.log('Diff cursor not visible, not adding shape');
  }

  console.log(`Created ${shapes.length} cursor shapes`);

  // Update the layout with the new shapes
  try {
    // Method 1: Using Plotly.relayout with direct containerId
    console.log(`Updating plot with ${shapes.length} cursor shapes using Plotly.relayout`);
    await Plotly.relayout(container, { shapes: shapes });
    console.log('Plotly.relayout completed successfully');
  } catch (error) {
    console.error('Error updating cursors with Plotly.relayout:', error);
    console.log('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    try {
      // Method 2: Using Plotly.relayout with global Plotly instance
      console.log('Trying alternative method to update cursors with global Plotly instance');
      const plotlyInstance = (window as any).Plotly;
      console.log('Global Plotly instance available:', !!plotlyInstance);
      
      if (plotlyInstance && typeof plotlyInstance.relayout === 'function') {
        console.log('Using global Plotly.relayout');
        await plotlyInstance.relayout(container, { shapes: shapes });
        console.log('Global Plotly.relayout completed successfully');
      } else {
        // Method 3: Direct DOM manipulation as last resort
        console.log('Trying direct DOM manipulation to update cursors');
        const plotElement = container as any;
        console.log('Plot element details for direct manipulation:', {
          hasFullLayout: !!plotElement._fullLayout,
          hasLayout: !!plotElement.layout,
          hasRedrawMethod: typeof plotElement.redraw === 'function'
        });
        
        if (plotElement && plotElement._fullLayout) {
          console.log('Directly setting _fullLayout.shapes');
          plotElement._fullLayout.shapes = shapes;
          
          if (typeof plotElement.redraw === 'function') {
            console.log('Calling element.redraw()');
            plotElement.redraw();
            console.log('Element redraw completed');
          } else if (plotlyInstance && typeof plotlyInstance.redraw === 'function') {
            console.log('Calling global Plotly.redraw()');
            plotlyInstance.redraw(container);
            console.log('Global Plotly redraw completed');
          } else {
            // Method 4: Complete replot as absolute last resort
            console.log('Attempting complete replot as last resort');
            const plotData = plotElement.data || [];
            const layout = plotElement.layout || {};
            layout.shapes = shapes;
            
            console.log('Replotting with Plotly.newPlot as last resort');
            await Plotly.newPlot(container, plotData, layout);
            console.log('Complete replot completed');
          }
        } else {
          console.error('Cannot access plot layout for cursor update');
        }
      }
    } catch (innerError) {
      console.error('Failed to update cursors with alternative methods:', innerError);
      console.log('Inner error details:', {
        name: innerError instanceof Error ? innerError.name : 'Unknown',
        message: innerError instanceof Error ? innerError.message : String(innerError),
        stack: innerError instanceof Error ? innerError.stack : 'No stack trace'
      });
    }
  }
  console.log('===== END UPDATE CURSORS =====');
}

/**
 * Get cursor values at a specific x position
 * @param {PlotData} plotData - The plot data
 * @param {number} x - The x position
 * @returns {Record<string, number>} The values at the cursor position
 */
export function getCursorValues(
  fileData: FileData,
  selectedSignals: string[],
  x: number
): Record<string, number> {
  const values: Record<string, number> = {};
  
  // Get the time axis
  const timeAxis = fileData.data.time || [];
  
  // Find the closest time index
  const closestIndex = findClosestTimeIndex(timeAxis, x);
  
  // Get the values for each signal
  selectedSignals.forEach(signal => {
    if (fileData.data[signal] && Array.isArray(fileData.data[signal]) && closestIndex < fileData.data[signal].length) {
      values[signal] = fileData.data[signal][closestIndex];
    }
  });
  
  return values;
}

/**
 * Find the closest time index to a given value
 * @param {number[]} timeAxis - The time axis values
 * @param {number} x - The x value to find
 * @returns {number} The index of the closest time value
 */
function findClosestTimeIndex(timeAxis: number[], x: number): number {
  if (!timeAxis.length) return -1;
  
  let closestIndex = 0;
  let closestDiff = Math.abs(timeAxis[0] - x);
  
  for (let i = 1; i < timeAxis.length; i++) {
    const diff = Math.abs(timeAxis[i] - x);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  
  return closestIndex;
}

/**
 * Calculate the difference between two cursor positions
 * @param {Record<string, number>} primaryValues - Values at primary cursor
 * @param {Record<string, number>} diffValues - Values at diff cursor
 * @returns {Record<string, number>} The difference between the values
 */
export function calculateCursorDiff(
  primaryValues: Record<string, number>,
  diffValues: Record<string, number>
): Record<string, number> {
  const diff: Record<string, number> = {};
  
  // Calculate the difference for each signal
  Object.keys(primaryValues).forEach(signal => {
    if (diffValues[signal] !== undefined) {
      diff[signal] = diffValues[signal] - primaryValues[signal];
    }
  });
  
  return diff;
}

/**
 * Debug function to check Plotly instance and capabilities
 * @param {string} containerId - The ID of the container element
 */
export function debugPlotly(containerId: string): void {
  console.log('===== DEBUG PLOTLY =====');
  
  // Check if Plotly is available globally
  const globalPlotly = (window as any).Plotly;
  console.log('Global Plotly available:', !!globalPlotly);
  
  if (globalPlotly) {
    console.log('Global Plotly version:', globalPlotly.version);
    console.log('Global Plotly methods:', Object.keys(globalPlotly).filter(key => typeof globalPlotly[key] === 'function'));
  }
  
  // Check container
  const container = document.getElementById(containerId);
  console.log('Container element found:', !!container);
  
  if (container) {
    console.log('Container properties:', {
      id: container.id,
      tagName: container.tagName,
      className: container.className,
      childElementCount: container.childElementCount,
      children: Array.from(container.children).map(child => ({
        tagName: child.tagName,
        className: child.className,
        id: child.id
      }))
    });
    
    // Check if container has Plotly data
    const plotElement = container as any;
    console.log('Container has Plotly data:', {
      hasData: !!plotElement.data,
      hasLayout: !!plotElement.layout,
      hasFullLayout: !!plotElement._fullLayout,
      hasFullData: !!plotElement._fullData
    });
    
    if (plotElement._fullLayout) {
      console.log('_fullLayout properties:', Object.keys(plotElement._fullLayout));
      console.log('_fullLayout.xaxis available:', !!plotElement._fullLayout.xaxis);
      
      if (plotElement._fullLayout.xaxis) {
        console.log('xaxis properties:', Object.keys(plotElement._fullLayout.xaxis));
        console.log('xaxis methods:', {
          hasP2d: typeof plotElement._fullLayout.xaxis.p2d === 'function',
          hasD2p: typeof plotElement._fullLayout.xaxis.d2p === 'function'
        });
        
        // Test coordinate conversion if available
        if (typeof plotElement._fullLayout.xaxis.p2d === 'function') {
          try {
            const testPixel = 100;
            const testData = plotElement._fullLayout.xaxis.p2d(testPixel);
            console.log(`Test conversion: pixel ${testPixel} -> data ${testData}`);
          } catch (error) {
            console.error('Error testing coordinate conversion:', error);
          }
        }
      }
      
      console.log('_fullLayout.shapes available:', !!plotElement._fullLayout.shapes);
      if (plotElement._fullLayout.shapes) {
        console.log('Shapes count:', plotElement._fullLayout.shapes.length);
        console.log('Shapes:', plotElement._fullLayout.shapes);
      }
    }
  }
  
  console.log('===== END DEBUG PLOTLY =====');
} 
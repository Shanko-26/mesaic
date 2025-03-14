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
  plotType?: 'scatter' | 'line' | 'bar' | 'heatmap' | '3d' | 'contour';
  theme?: 'light' | 'dark' | 'custom';
  annotations?: PlotAnnotation[];
  gridLines?: boolean;
  rangeSelectorEnabled?: boolean;
  interactiveTooltips?: boolean;
}

export interface PlotAnnotation {
  text: string;
  x: number;
  y?: number;
  xref?: 'x' | 'paper';
  yref?: 'y' | 'paper';
  showarrow?: boolean;
  arrowhead?: number;
  arrowcolor?: string;
  arrowsize?: number;
  bgcolor?: string;
  bordercolor?: string;
  borderwidth?: number;
  borderpad?: number;
  font?: {
    family?: string;
    size?: number;
    color?: string;
  };
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

/**
 * Position a cursor at a specific time value
 * @param {string} containerId - ID of the plot container
 * @param {CursorData} cursor - Cursor data to update
 * @param {number} timeValue - Time value to position the cursor at
 * @param {number[]} timeAxis - Time axis data
 * @returns {CursorData} Updated cursor data
 */
export function positionCursorAtTime(
  containerId: string,
  cursor: CursorData,
  timeValue: number,
  timeAxis: number[]
): CursorData {
  // Create a new cursor with the specified time value
  const newCursor: CursorData = {
    ...cursor,
    x: timeValue,
    visible: true
  };
  
  // Update the plot with the new cursor
  const container = document.getElementById(containerId);
  if (container) {
    try {
      // Use Plotly to update the cursor shape
      const shapes = [];
      
      if (newCursor.visible) {
        shapes.push({
          type: 'line',
          x0: newCursor.x,
          y0: 0,
          x1: newCursor.x,
          y1: 1,
          xref: 'x',
          yref: 'paper',
          line: {
            color: newCursor.color,
            width: 2,
            dash: 'solid'
          }
        });
      }
      
      Plotly.relayout(container, {
        'shapes': shapes
      });
      
      console.log(`Cursor positioned at time ${timeValue}`);
    } catch (error) {
      console.error('Error positioning cursor:', error);
    }
  }
  
  return newCursor;
}

/**
 * Enable brush selection for zooming on a plot
 * @param {string} containerId - The ID of the container element
 * @returns {void}
 */
export function enableBrushSelection(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }

  try {
    // Configure the plot for brush selection
    Plotly.update(container, {}, {
      dragmode: 'select',
      selectdirection: 'h', // horizontal selection only
      hovermode: 'closest'
    });

    // Add event listener for selection
    // Use Plotly's event system instead of DOM events
    const plotlyContainer = container as any;
    plotlyContainer.on('plotly_selected', (eventData: any) => {
      if (!eventData || !eventData.range) {
        return;
      }

      // Get the selected x-range
      const xRange = eventData.range.x;
      if (!xRange || xRange.length !== 2) {
        return;
      }

      // Zoom to the selected range
      Plotly.relayout(container, {
        'xaxis.range': [xRange[0], xRange[1]],
        'dragmode': 'select' // Keep selection mode active
      });

      console.log(`Zoomed to range: ${xRange[0]} to ${xRange[1]}`);
    });

    console.log('Brush selection enabled');
  } catch (error) {
    console.error('Error enabling brush selection:', error);
  }
}

/**
 * Disable brush selection on a plot
 * @param {string} containerId - The ID of the container element
 * @returns {void}
 */
export function disableBrushSelection(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }

  try {
    // Reset to default drag mode (pan)
    Plotly.relayout(container, {
      dragmode: 'pan'
    });

    // Remove the selection event listener using Plotly's event system
    const plotlyContainer = container as any;
    if (plotlyContainer && typeof plotlyContainer.removeAllListeners === 'function') {
      plotlyContainer.removeAllListeners('plotly_selected');
    } else {
      console.warn('Could not remove event listeners, Plotly container not properly initialized');
    }

    console.log('Brush selection disabled');
  } catch (error) {
    console.error('Error disabling brush selection:', error);
  }
}

/**
 * Configure a plot with multiple Y-axes for different signal groups
 * @param {string} containerId - The ID of the container element
 * @param {Record<string, string[]>} signalGroups - Groups of signals and their members
 * @param {FileData} fileData - The file data containing signal values
 * @returns {Promise<void>}
 */
export async function configureMultiYAxes(
  containerId: string,
  signalGroups: Record<string, string[]>,
  fileData: FileData
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }

  try {
    // Get the time axis
    const timeAxis = fileData.data.time || [];
    if (!timeAxis.length) {
      console.error('Time axis not available');
      return;
    }

    // Create traces for each signal group with different y-axes
    const traces: any[] = [];
    const layout: any = {
      grid: {
        rows: 1,
        columns: 1,
        pattern: 'independent'
      },
      xaxis: {
        title: 'Time',
        domain: [0, 0.9] // Leave space for multiple y-axes
      }
    };

    // Create a y-axis for each group
    Object.entries(signalGroups).forEach(([groupName, signals], groupIndex) => {
      // Skip empty groups
      if (!signals.length) return;

      // Create a y-axis for this group
      const yAxisId = groupIndex === 0 ? 'yaxis' : `yaxis${groupIndex + 1}`;
      
      // Configure the y-axis
      layout[yAxisId] = {
        title: groupName,
        titlefont: { color: getGroupColor(groupName, groupIndex) },
        tickfont: { color: getGroupColor(groupName, groupIndex) },
        side: groupIndex % 2 === 0 ? 'left' : 'right',
        position: groupIndex === 0 ? 0 : 0.9,
        anchor: 'free',
        overlaying: groupIndex > 0 ? 'y' : undefined
      };

      // Add traces for each signal in this group
      signals.forEach((signal, signalIndex) => {
        if (!fileData.data[signal] || !Array.isArray(fileData.data[signal])) {
          console.warn(`Signal ${signal} is not an array or is missing`);
          return;
        }

        const values = fileData.data[signal];
        const color = getSignalColor(signal, signalIndex, groupName, groupIndex);

        traces.push({
          x: timeAxis.slice(0, values.length),
          y: values,
          type: 'scatter',
          mode: 'lines',
          name: signal,
          line: {
            width: 2,
            color: color
          },
          yaxis: groupIndex === 0 ? 'y' : `y${groupIndex + 1}`
        });
      });
    });

    // Update the plot with the new configuration
    await Plotly.react(container, traces, layout);
    console.log('Multi-Y axes configured');
  } catch (error) {
    console.error('Error configuring multi-Y axes:', error);
  }
}

/**
 * Toggle between linear and logarithmic scale for an axis
 * @param {string} containerId - The ID of the container element
 * @param {'x' | 'y'} axis - The axis to toggle ('x' or 'y')
 * @returns {Promise<boolean>} True if the axis is now logarithmic, false if linear
 */
export async function toggleLogarithmicScale(
  containerId: string,
  axis: 'x' | 'y' = 'y'
): Promise<boolean> {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return false;
  }

  try {
    // Get the current axis type
    const layout = (container as any)._fullLayout;
    const axisName = axis === 'x' ? 'xaxis' : 'yaxis';
    const currentType = layout[axisName].type;
    
    // Toggle between linear and log
    const newType = currentType === 'log' ? 'linear' : 'log';
    
    // Update the axis type
    const update: any = {};
    update[`${axisName}.type`] = newType;
    
    await Plotly.relayout(container, update);
    console.log(`${axis}-axis scale set to ${newType}`);
    
    return newType === 'log';
  } catch (error) {
    console.error(`Error toggling ${axis}-axis scale:`, error);
    return false;
  }
}

/**
 * Apply signal smoothing to visualized data
 * @param {string} containerId - The ID of the container element
 * @param {string} signalName - The name of the signal to smooth
 * @param {number} windowSize - The size of the smoothing window
 * @param {'movingAverage' | 'exponential'} method - The smoothing method
 * @param {FileData} fileData - The original file data
 * @returns {Promise<void>}
 */
export async function applySmoothingToSignal(
  containerId: string,
  signalName: string,
  windowSize: number,
  method: 'movingAverage' | 'exponential',
  fileData: FileData
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }

  try {
    // Get the original signal data
    const signalData = fileData.data[signalName];
    if (!signalData || !Array.isArray(signalData)) {
      console.error(`Signal ${signalName} not found or not an array`);
      return;
    }

    // Get the time axis
    const timeAxis = fileData.data.time || Array.from({ length: signalData.length }, (_, i) => i);

    // Apply smoothing
    let smoothedData: number[];
    if (method === 'movingAverage') {
      smoothedData = applyMovingAverage(signalData, windowSize);
    } else {
      smoothedData = applyExponentialSmoothing(signalData, 2 / (windowSize + 1));
    }

    // Find the trace index for this signal
    const plotData = (container as any).data;
    const traceIndex = plotData.findIndex((trace: any) => trace.name === signalName);

    if (traceIndex === -1) {
      console.error(`Trace for signal ${signalName} not found`);
      return;
    }

    // Update the trace with smoothed data
    const update: any = {
      y: [smoothedData]
    };

    // Add a suffix to the name to indicate smoothing
    const smoothingLabel = method === 'movingAverage' ? 'MA' : 'EMA';
    update.name = [`${signalName} (${smoothingLabel}${windowSize})`];

    // Update the trace
    await Plotly.restyle(container, update, [traceIndex]);
    console.log(`Applied ${method} smoothing to ${signalName} with window size ${windowSize}`);
  } catch (error) {
    console.error('Error applying smoothing:', error);
  }
}

/**
 * Apply moving average smoothing to a signal
 * @param {number[]} data - The signal data
 * @param {number} windowSize - The size of the moving average window
 * @returns {number[]} The smoothed data
 */
function applyMovingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
      sum += data[j];
      count++;
    }

    result.push(sum / count);
  }

  return result;
}

/**
 * Apply exponential smoothing to a signal
 * @param {number[]} data - The signal data
 * @param {number} alpha - The smoothing factor (0 < alpha < 1)
 * @returns {number[]} The smoothed data
 */
function applyExponentialSmoothing(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  
  const result: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  
  return result;
}

/**
 * Get a color for a signal group
 * @param {string} groupName - The name of the group
 * @param {number} groupIndex - The index of the group
 * @returns {string} A color for the group
 */
function getGroupColor(groupName: string, groupIndex: number): string {
  // Define a set of distinct colors for groups
  const groupColors = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf'  // teal
  ];
  
  return groupColors[groupIndex % groupColors.length];
}

/**
 * Get a color for a signal within a group
 * @param {string} signalName - The name of the signal
 * @param {number} signalIndex - The index of the signal within its group
 * @param {string} groupName - The name of the group
 * @param {number} groupIndex - The index of the group
 * @returns {string} A color for the signal
 */
function getSignalColor(signalName: string, signalIndex: number, groupName: string, groupIndex: number): string {
  // Get the base color for the group
  const baseColor = getGroupColor(groupName, groupIndex);
  
  // For the first few signals, use the base group color with varying opacity
  if (signalIndex < 3) {
    const opacity = 1.0 - (signalIndex * 0.2);
    return adjustColorOpacity(baseColor, opacity);
  }
  
  // For additional signals, create variations of the base color
  return adjustColorShade(baseColor, signalIndex);
}

/**
 * Adjust the opacity of a color
 * @param {string} color - The color in hex format
 * @param {number} opacity - The opacity (0-1)
 * @returns {string} The color with adjusted opacity
 */
function adjustColorOpacity(color: string, opacity: number): string {
  // Convert hex to rgb
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Adjust the shade of a color
 * @param {string} color - The color in hex format
 * @param {number} index - The index to use for shade adjustment
 * @returns {string} The color with adjusted shade
 */
function adjustColorShade(color: string, index: number): string {
  // Convert hex to rgb
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Adjust the shade based on the index
  const factor = 0.8 + (index % 3) * 0.1; // Creates slight variations
  
  // Apply the factor and ensure values are in valid range
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Convert the plot to a 3D visualization
 * @param {string} containerId - ID of the plot container
 * @param {FileData} fileData - The file data to visualize
 * @param {string[]} selectedSignals - The signals to include in the visualization
 * @returns {Promise<any>} The updated plot
 */
export async function convertTo3D(
  containerId: string,
  fileData: FileData,
  selectedSignals: string[] = []
): Promise<any> {
  if (selectedSignals.length < 2) {
    throw new Error('At least 2 signals are required for 3D visualization');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  // Get time axis
  let timeAxis: number[] = [];
  if (fileData.data.time && Array.isArray(fileData.data.time)) {
    timeAxis = fileData.data.time;
  } else {
    const maxLength = Math.max(...selectedSignals.map(s => fileData.data[s]?.length || 0));
    timeAxis = Array.from({ length: maxLength }, (_, i) => i);
  }

  // Create 3D data
  const traces = [];
  
  // If we have exactly 2 signals, create a 3D line plot (time, signal1, signal2)
  if (selectedSignals.length === 2) {
    traces.push({
      type: 'scatter3d',
      mode: 'lines',
      x: timeAxis,
      y: fileData.data[selectedSignals[0]],
      z: fileData.data[selectedSignals[1]],
      line: {
        width: 4,
        color: 'rgba(100, 100, 240, 0.8)'
      },
      name: `${selectedSignals[0]} vs ${selectedSignals[1]}`
    });
  } 
  // If we have 3 or more signals, use the first 3 for a 3D plot
  else if (selectedSignals.length >= 3) {
    traces.push({
      type: 'scatter3d',
      mode: 'lines',
      x: fileData.data[selectedSignals[0]],
      y: fileData.data[selectedSignals[1]],
      z: fileData.data[selectedSignals[2]],
      line: {
        width: 4,
        color: 'rgba(100, 100, 240, 0.8)'
      },
      name: `${selectedSignals[0]} vs ${selectedSignals[1]} vs ${selectedSignals[2]}`
    });
  }

  const layout = {
    title: '3D Signal Visualization',
    scene: {
      xaxis: { title: selectedSignals.length === 2 ? 'Time' : selectedSignals[0] },
      yaxis: { title: selectedSignals.length === 2 ? selectedSignals[0] : selectedSignals[1] },
      zaxis: { title: selectedSignals.length === 2 ? selectedSignals[1] : selectedSignals[2] },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.5 }
      }
    },
    margin: { l: 0, r: 0, b: 0, t: 50 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToAdd: ['hoverClosest3d', 'orbitRotation'],
    displaylogo: false
  };

  try {
    return await Plotly.newPlot(container, traces, layout, config);
  } catch (error) {
    console.error('Error creating 3D plot:', error);
    throw error;
  }
}

/**
 * Create a heatmap visualization from the data
 * @param {string} containerId - ID of the plot container
 * @param {FileData} fileData - The file data to visualize
 * @param {string[]} selectedSignals - The signals to include in the visualization
 * @param {string} colorScale - The color scale to use for the heatmap
 * @returns {Promise<any>} The created heatmap plot
 */
export async function createHeatmap(
  containerId: string,
  fileData: FileData,
  selectedSignals: string[] = [],
  colorScale: string = 'Viridis'
): Promise<any> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  // Get time axis
  let timeAxis: number[] = [];
  if (fileData.data.time && Array.isArray(fileData.data.time)) {
    timeAxis = fileData.data.time;
  } else {
    const maxLength = Math.max(...selectedSignals.map(s => fileData.data[s]?.length || 0));
    timeAxis = Array.from({ length: maxLength }, (_, i) => i);
  }

  // Create a matrix for the heatmap
  // Each row is a signal, each column is a time point
  const zValues: number[][] = [];
  
  for (const signal of selectedSignals) {
    if (fileData.data[signal] && Array.isArray(fileData.data[signal])) {
      zValues.push(fileData.data[signal]);
    }
  }

  const trace = {
    type: 'heatmap',
    z: zValues,
    x: timeAxis,
    y: selectedSignals,
    colorscale: colorScale,
    hoverongaps: false,
    showscale: true,
    colorbar: {
      title: 'Value',
      thickness: 20,
      thicknessmode: 'pixels',
      len: 0.9,
      lenmode: 'fraction',
      outlinewidth: 1
    }
  };

  const layout = {
    title: 'Signal Heatmap',
    xaxis: {
      title: 'Time',
      autorange: true
    },
    yaxis: {
      title: 'Signals',
      autorange: true
    },
    margin: { l: 100, r: 50, b: 50, t: 50, pad: 4 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true
  };

  try {
    return await Plotly.newPlot(container, [trace], layout, config);
  } catch (error) {
    console.error('Error creating heatmap:', error);
    throw error;
  }
}

/**
 * Add interactive range selector to the plot
 * @param {string} containerId - ID of the plot container
 * @returns {Promise<any>} The updated plot
 */
export async function addRangeSelector(
  containerId: string
): Promise<any> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  try {
    // Get the current layout
    // @ts-ignore - Accessing Plotly's internal properties
    const currentLayout = container._fullLayout || {};
    
    // Add range selector to x-axis
    const updatedLayout = {
      ...currentLayout,
      xaxis: {
        ...currentLayout.xaxis,
        rangeslider: {
          visible: true,
          thickness: 0.1
        },
        rangeselector: {
          buttons: [
            {
              count: 1,
              label: '1s',
              step: 'second',
              stepmode: 'backward'
            },
            {
              count: 10,
              label: '10s',
              step: 'second',
              stepmode: 'backward'
            },
            {
              count: 30,
              label: '30s',
              step: 'second',
              stepmode: 'backward'
            },
            {
              step: 'all',
              label: 'All'
            }
          ],
          x: 0,
          y: 1.1,
          font: { size: 10 }
        }
      }
    };

    return await Plotly.relayout(container, updatedLayout);
  } catch (error) {
    console.error('Error adding range selector:', error);
    throw error;
  }
}

/**
 * Add annotations to the plot
 * @param {string} containerId - ID of the plot container
 * @param {PlotAnnotation[]} annotations - The annotations to add
 * @returns {Promise<any>} The updated plot
 */
export async function addAnnotations(
  containerId: string,
  annotations: PlotAnnotation[]
): Promise<any> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  try {
    // Get the current layout
    // @ts-ignore - Accessing Plotly's internal properties
    const currentLayout = container._fullLayout || {};
    
    // Add annotations to the layout
    const updatedLayout = {
      ...currentLayout,
      annotations: annotations.map(annotation => ({
        text: annotation.text,
        x: annotation.x,
        y: annotation.y || 0,
        xref: annotation.xref || 'x',
        yref: annotation.yref || 'paper',
        showarrow: annotation.showarrow !== undefined ? annotation.showarrow : true,
        arrowhead: annotation.arrowhead || 2,
        arrowcolor: annotation.arrowcolor || 'rgba(0, 0, 0, 0.6)',
        arrowsize: annotation.arrowsize || 1,
        bgcolor: annotation.bgcolor || 'rgba(255, 255, 255, 0.8)',
        bordercolor: annotation.bordercolor || 'rgba(0, 0, 0, 0.2)',
        borderwidth: annotation.borderwidth || 1,
        borderpad: annotation.borderpad || 4,
        font: annotation.font || {
          family: 'Arial, sans-serif',
          size: 12,
          color: 'rgba(0, 0, 0, 0.8)'
        }
      }))
    };

    return await Plotly.relayout(container, updatedLayout);
  } catch (error) {
    console.error('Error adding annotations:', error);
    throw error;
  }
}

/**
 * Apply a theme to the plot
 * @param {string} containerId - ID of the plot container
 * @param {'light' | 'dark' | 'custom'} theme - The theme to apply
 * @param {Record<string, any>} customTheme - Custom theme settings (only used if theme is 'custom')
 * @returns {Promise<any>} The updated plot
 */
export async function applyTheme(
  containerId: string,
  theme: 'light' | 'dark' | 'custom',
  customTheme?: Record<string, any>
): Promise<any> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  try {
    // Get the current layout
    // @ts-ignore - Accessing Plotly's internal properties
    const currentLayout = container._fullLayout || {};
    
    let themeSettings: Record<string, any> = {};
    
    if (theme === 'light') {
      themeSettings = {
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: {
          family: 'Arial, sans-serif',
          color: 'rgb(50, 50, 50)'
        },
        xaxis: {
          ...currentLayout.xaxis,
          gridcolor: 'rgb(230, 230, 230)',
          linecolor: 'rgb(200, 200, 200)'
        },
        yaxis: {
          ...currentLayout.yaxis,
          gridcolor: 'rgb(230, 230, 230)',
          linecolor: 'rgb(200, 200, 200)'
        }
      };
    } else if (theme === 'dark') {
      themeSettings = {
        paper_bgcolor: 'rgb(40, 40, 40)',
        plot_bgcolor: 'rgb(40, 40, 40)',
        font: {
          family: 'Arial, sans-serif',
          color: 'rgb(220, 220, 220)'
        },
        xaxis: {
          ...currentLayout.xaxis,
          gridcolor: 'rgb(80, 80, 80)',
          linecolor: 'rgb(100, 100, 100)',
          tickfont: { color: 'rgb(200, 200, 200)' }
        },
        yaxis: {
          ...currentLayout.yaxis,
          gridcolor: 'rgb(80, 80, 80)',
          linecolor: 'rgb(100, 100, 100)',
          tickfont: { color: 'rgb(200, 200, 200)' }
        }
      };
    } else if (theme === 'custom' && customTheme) {
      themeSettings = customTheme;
    }

    const updatedLayout = {
      ...currentLayout,
      ...themeSettings
    };

    return await Plotly.relayout(container, updatedLayout);
  } catch (error) {
    console.error('Error applying theme:', error);
    throw error;
  }
}

/**
 * Enable interactive tooltips with enhanced information
 * @param {string} containerId - ID of the plot container
 * @param {FileData} fileData - The file data
 * @returns {Promise<any>} The updated plot
 */
export async function enableEnhancedTooltips(
  containerId: string,
  fileData: FileData
): Promise<any> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  try {
    // Get the current data
    // @ts-ignore - Accessing Plotly's internal properties
    const currentData = container.data || [];
    
    // Update each trace with enhanced hover templates
    const updatedData = currentData.map((trace: any, index: number) => {
      const signalName = trace.name || `Signal ${index + 1}`;
      
      return {
        ...trace,
        hovertemplate: `<b>${signalName}</b><br>` +
          'Time: %{x:.4f}s<br>' +
          'Value: %{y:.4f}<br>' +
          '<extra></extra>'
      };
    });

    return await Plotly.update(container, updatedData, {});
  } catch (error) {
    console.error('Error enabling enhanced tooltips:', error);
    throw error;
  }
}

/**
 * Create a contour plot from the data
 * @param {string} containerId - ID of the plot container
 * @param {FileData} fileData - The file data to visualize
 * @param {string[]} selectedSignals - The signals to include in the visualization
 * @param {string} colorScale - The color scale to use for the contour plot
 * @returns {Promise<any>} The created contour plot
 */
export async function createContourPlot(
  containerId: string,
  fileData: FileData,
  selectedSignals: string[] = [],
  colorScale: string = 'Viridis'
): Promise<any> {
  if (selectedSignals.length < 1) {
    throw new Error('At least 1 signal is required for contour visualization');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  // Get time axis
  let timeAxis: number[] = [];
  if (fileData.data.time && Array.isArray(fileData.data.time)) {
    timeAxis = fileData.data.time;
  } else {
    const maxLength = Math.max(...selectedSignals.map(s => fileData.data[s]?.length || 0));
    timeAxis = Array.from({ length: maxLength }, (_, i) => i);
  }

  // Create traces for each signal
  const traces = selectedSignals.map(signal => {
    if (!fileData.data[signal] || !Array.isArray(fileData.data[signal])) {
      console.warn(`Signal ${signal} is not an array or is missing`);
      return null;
    }

    return {
      type: 'contour',
      z: [fileData.data[signal]], // Wrap in array for contour plot
      x: timeAxis.slice(0, fileData.data[signal].length),
      colorscale: colorScale,
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: {
          family: 'Arial, sans-serif',
          size: 10,
          color: 'white'
        }
      },
      name: signal
    };
  }).filter(trace => trace !== null);

  const layout = {
    title: 'Signal Contour Visualization',
    xaxis: {
      title: 'Time',
      autorange: true
    },
    yaxis: {
      title: 'Value',
      autorange: true
    },
    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true
  };

  try {
    return await Plotly.newPlot(container, traces, layout, config);
  } catch (error) {
    console.error('Error creating contour plot:', error);
    throw error;
  }
} 
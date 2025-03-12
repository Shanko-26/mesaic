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

export interface PlotData {
  data: any[]; // Using any instead of Plotly.Data
  layout: any; // Using any instead of Partial<Plotly.Layout>
  config: any; // Using any instead of Partial<Plotly.Config>
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

/**
 * Generate plot data from file data
 * @param {FileData} fileData - The file data to visualize
 * @param {string[]} selectedSignals - The signals to include in the visualization
 * @param {PlotConfig} config - Configuration options for the plot
 * @returns {PlotData} The plot data
 */
export function generatePlotData(
  fileData: FileData,
  selectedSignals: string[] = [],
  config: Partial<PlotConfig> = {}
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
    config: plotlyConfig
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
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }
  
  return Plotly.newPlot(
    container,
    plotData.data,
    plotData.layout,
    plotData.config
  );
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
  
  return Plotly.react(
    container,
    plotData.data,
    plotData.layout,
    plotData.config
  );
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
/**
 * AI service for handling interactions with the AI backend
 */
import { processQuery } from './api';
import { getCurrentFile, FileData } from './file';
import { PlotData, CursorData, getCursorValues, updateCursors } from './visualization';
import { SignalOperation, AIQueryResult, DerivedSignal } from '../types/signal';

export interface QueryResult {
  query: string;
  answer: string;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    sources?: string[];
    visualizationSuggestion?: PlotData;
    [key: string]: any;
  };
}

export interface QueryContext {
  selectedSignals?: string[];
  primaryCursor?: CursorData;
  diffCursor?: CursorData;
  zoomLevel?: number;
  timeRange?: [number, number];
}

/**
 * Process a natural language query about the current file
 * @param {string} query - The natural language query
 * @param {QueryContext} context - Optional context about the current visualization state
 * @returns {Promise<QueryResult>} The query result
 */
export async function processNaturalLanguageQuery(
  query: string, 
  context?: QueryContext
): Promise<QueryResult> {
  const currentFile = getCurrentFile();
  
  if (!currentFile) {
    throw new Error('No file is currently loaded');
  }
  
  try {
    // Include context in the query if available
    const contextEnhancedQuery = context ? enhanceQueryWithContext(query, context) : query;
    
    console.log('Processing query with context:', {
      originalQuery: query,
      enhancedQuery: contextEnhancedQuery,
      context
    });
    
    const result = await processQuery(contextEnhancedQuery, currentFile.path, context);
    
    return {
      query,
      answer: result.answer,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw new Error(`Failed to process query: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Enhance a query with context about the current visualization state
 * @param {string} query - The original query
 * @param {QueryContext} context - Context about the current visualization state
 * @returns {string} The enhanced query
 */
function enhanceQueryWithContext(query: string, context: QueryContext): string {
  // Start with the original query
  let enhancedQuery = query;
  
  // Add information about selected signals
  if (context.selectedSignals && context.selectedSignals.length > 0) {
    enhancedQuery += ` [Context: Currently visualizing signals: ${context.selectedSignals.join(', ')}]`;
  }
  
  // Add information about cursor positions
  if (context.primaryCursor?.visible) {
    enhancedQuery += ` [Primary cursor at x=${context.primaryCursor.x.toFixed(2)}]`;
  }
  
  if (context.diffCursor?.visible) {
    enhancedQuery += ` [Diff cursor at x=${context.diffCursor.x.toFixed(2)}]`;
  }
  
  // Add information about zoom level or time range
  if (context.timeRange) {
    enhancedQuery += ` [Current time range: ${context.timeRange[0].toFixed(2)} to ${context.timeRange[1].toFixed(2)}]`;
  }
  
  return enhancedQuery;
}

/**
 * Get suggested queries based on the current file and visualization state
 * @param {FileData} fileData - The current file data
 * @param {QueryContext} context - Context about the current visualization state
 * @returns {string[]} List of suggested queries
 */
export function getSuggestedQueries(fileData?: FileData, context?: QueryContext): string[] {
  if (!fileData) {
    return [];
  }
  
  const suggestions: string[] = [
    'What are the main signals in this file?',
    'Show me the minimum and maximum values for each signal',
    'Are there any anomalies in the data?',
    'What is the sampling rate of this data?',
    'Summarize the key characteristics of this measurement',
  ];
  
  // Add context-aware suggestions
  if (context?.selectedSignals && context.selectedSignals.length > 0) {
    const signals = context.selectedSignals;
    
    if (signals.length === 1) {
      suggestions.push(`What is the trend of ${signals[0]} over time?`);
      suggestions.push(`What are the peak values of ${signals[0]}?`);
    } else if (signals.length >= 2) {
      suggestions.push(`What is the correlation between ${signals[0]} and ${signals[1]}?`);
      suggestions.push(`Compare the patterns between ${signals[0]} and ${signals[1]}`);
    }
  }
  
  // Add cursor-aware suggestions
  if (context?.primaryCursor?.visible && context?.diffCursor?.visible) {
    suggestions.push(`What changed between the primary and diff cursor positions?`);
    suggestions.push(`Calculate the rate of change between the cursors`);
  } else if (context?.primaryCursor?.visible) {
    suggestions.push(`What's happening at the primary cursor position?`);
  }
  
  return suggestions;
}

/**
 * Generate a visualization suggestion based on the query and data
 * @param {string} query - The natural language query
 * @param {FileData} fileData - The file data
 * @returns {Promise<PlotData | null>} The suggested visualization or null if no suggestion
 */
export async function generateVisualizationSuggestion(
  query: string, 
  fileData: FileData
): Promise<PlotData | null> {
  // This would typically call the backend to generate a visualization suggestion
  // For now, we'll return null
  return null;
}

/**
 * Extract insights from the current file
 * @returns {Promise<string[]>} List of insights
 */
export async function extractInsights(): Promise<string[]> {
  const currentFile = getCurrentFile();
  
  if (!currentFile) {
    throw new Error('No file is currently loaded');
  }
  
  try {
    const result = await processQuery('Extract key insights from this data', currentFile.path);
    
    // Parse insights from the answer
    // This assumes the backend returns insights in a format we can parse
    // If not, we'll just return the answer as a single insight
    try {
      if (result.metadata?.insights && Array.isArray(result.metadata.insights)) {
        return result.metadata.insights;
      }
      
      // Try to parse bullet points or numbered lists
      const bulletPoints = result.answer.split(/\n\s*[\-\*•]\s+/);
      if (bulletPoints.length > 1) {
        return bulletPoints.slice(1); // Skip the first element which is text before the first bullet
      }
      
      const numberedPoints = result.answer.split(/\n\s*\d+\.\s+/);
      if (numberedPoints.length > 1) {
        return numberedPoints.slice(1); // Skip the first element which is text before the first number
      }
      
      // If we can't parse it, return the whole answer as one insight
      return [result.answer];
    } catch (parseError) {
      console.error('Error parsing insights:', parseError);
      return [result.answer];
    }
  } catch (error) {
    console.error('Error extracting insights:', error);
    throw new Error(`Failed to extract insights: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a report about the current file
 * @param {string} format - The format of the report ('text', 'html', 'markdown')
 * @returns {Promise<string>} The generated report
 */
export async function generateReport(format: 'text' | 'html' | 'markdown' = 'markdown'): Promise<string> {
  const currentFile = getCurrentFile();
  
  if (!currentFile) {
    throw new Error('No file is currently loaded');
  }
  
  try {
    const result = await processQuery(`Generate a detailed report about this data in ${format} format`, currentFile.path);
    
    return result.answer;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a chat response based on user message and current data context
 * @param {string} userMessage - The user's message
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @param {Object} cursors - Current cursor positions
 * @param {CursorData} cursors.primaryCursor - Primary cursor data
 * @param {CursorData} cursors.diffCursor - Diff cursor data
 * @param {Object} cursorValues - Values at cursor positions
 * @returns {Promise<{message: string, cursorPosition?: {x: number, signal: string, value: number}}>} The generated response and optional cursor position
 */
export async function generateChatResponse(
  userMessage: string,
  fileData: FileData | null,
  selectedSignals: string[],
  cursors: { primaryCursor: CursorData; diffCursor: CursorData },
  cursorValues: { primary: Record<string, number>; diff: Record<string, number>; difference: Record<string, number> }
): Promise<{message: string, cursorPosition?: {x: number, signal: string, value: number}}> {
  if (!fileData) {
    return { message: "Please load a data file first so I can help you analyze it." };
  }
  
  if (selectedSignals.length === 0) {
    return { message: "Please select some signals from the sidebar so I can analyze them for you." };
  }
  
  // Normalize the user message for easier matching
  const normalizedMessage = userMessage.toLowerCase();
  
  // Check for cursor-related queries
  if (normalizedMessage.includes('cursor') || normalizedMessage.includes('position')) {
    return { message: analyzeCursorPositions(fileData, cursors, cursorValues) };
  }
  
  // Check for maximum value queries
  if (normalizedMessage.includes('maximum') || normalizedMessage.includes('max')) {
    return { message: findExtremeValues(fileData, selectedSignals, 'max') };
  }
  
  // Check for minimum value queries
  if (normalizedMessage.includes('minimum') || normalizedMessage.includes('min')) {
    return { message: findExtremeValues(fileData, selectedSignals, 'min') };
  }
  
  // Check for average/mean value queries
  if (normalizedMessage.includes('average') || normalizedMessage.includes('avg') || normalizedMessage.includes('mean')) {
    return { message: calculateAverageValues(fileData, selectedSignals) };
  }
  
  // Check for comparison queries
  if (normalizedMessage.includes('compare')) {
    return { message: compareSignals(fileData, selectedSignals) };
  }
  
  // Check for cursor positioning requests
  if (normalizedMessage.includes('position cursor') || normalizedMessage.includes('move cursor')) {
    const result = positionCursorAtValue(userMessage, fileData, selectedSignals, cursors);
    if (typeof result === 'string') {
      return { message: result };
    } else {
      return result;
    }
  }
  
  // Check for correlation queries
  if (normalizedMessage.includes('correlation') || normalizedMessage.includes('correlate')) {
    return { message: calculateCorrelation(fileData, selectedSignals) };
  }
  
  // Default response for other queries
  return { 
    message: "I can help you analyze and process your signal data. Try asking about:\n\n**Data Analysis:**\n- \"What's the maximum value of vehicleSpeed?\"\n- \"Calculate the average throttlePosition\"\n- \"Compare engineRPM and vehicleSpeed\"\n- \"What's the correlation between throttlePosition and engineRPM?\"\n\n**Signal Processing:**\n- \"Apply a lowpass filter to vehicleSpeed with cutoff frequency 0.1\"\n- \"Calculate the derivative of vehicleSpeed\"\n- \"Add vehicleSpeed and throttlePosition\"\n- \"Scale engineRPM by a factor of 0.5\"\n- \"Compute statistics for brakePosition\"\n\n**Interactive Analysis:**\n- Position a cursor on the plot and ask \"What are the values at this position?\"\n- \"Show me the FFT of vehicleSpeed with sample rate 100\"\n\nYou can also combine operations to perform more complex analysis."
  };
}

/**
 * Analyze cursor positions and return information about values at those positions
 * @param {FileData} fileData - The current file data
 * @param {Object} cursors - Current cursor positions
 * @param {Object} cursorValues - Values at cursor positions
 * @returns {string} Analysis of cursor positions
 */
function analyzeCursorPositions(
  fileData: FileData,
  cursors: { primaryCursor: CursorData; diffCursor: CursorData },
  cursorValues: { primary: Record<string, number>; diff: Record<string, number>; difference: Record<string, number> }
): string {
  const { primaryCursor, diffCursor } = cursors;
  
  if (!primaryCursor.visible && !diffCursor.visible) {
    return "No cursors are currently positioned. Click on the plot to position a cursor first.";
  }
  
  let response = "";
  
  if (primaryCursor.visible) {
    response += `Primary cursor is positioned at ${primaryCursor.x.toFixed(2)}s. Values at this position:\n`;
    
    Object.entries(cursorValues.primary).forEach(([signal, value]) => {
      const unit = fileData.metadata?.units?.[signal] || '';
      response += `\n- ${signal}: ${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
    });
  }
  
  if (diffCursor.visible) {
    if (response) response += "\n\n";
    response += `Diff cursor is positioned at ${diffCursor.x.toFixed(2)}s. Values at this position:\n`;
    
    Object.entries(cursorValues.diff).forEach(([signal, value]) => {
      const unit = fileData.metadata?.units?.[signal] || '';
      response += `\n- ${signal}: ${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
    });
  }
  
  if (primaryCursor.visible && diffCursor.visible) {
    response += `\n\nTime difference between cursors: ${Math.abs(primaryCursor.x - diffCursor.x).toFixed(2)}s`;
    
    if (Object.keys(cursorValues.difference).length > 0) {
      response += "\nValue differences:";
      
      Object.entries(cursorValues.difference).forEach(([signal, value]) => {
        const unit = fileData.metadata?.units?.[signal] || '';
        response += `\n- ${signal}: ${value > 0 ? '+' : ''}${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
      });
    }
  }
  
  return response;
}

/**
 * Find extreme values (min or max) in the selected signals
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @param {'min' | 'max'} type - Type of extreme value to find
 * @returns {string} Analysis of extreme values
 */
function findExtremeValues(fileData: FileData, selectedSignals: string[], type: 'min' | 'max'): string {
  const isMax = type === 'max';
  const extremeValues: Record<string, number> = {};
  let extremeSignal = '';
  let extremeValue = isMax ? -Infinity : Infinity;
  let extremeTime = 0;
  
  selectedSignals.forEach(signal => {
    const values = fileData.data[signal];
    if (values && Array.isArray(values)) {
      const extreme = isMax ? Math.max(...values) : Math.min(...values);
      extremeValues[signal] = extreme;
      
      if ((isMax && extreme > extremeValue) || (!isMax && extreme < extremeValue)) {
        extremeValue = extreme;
        extremeSignal = signal;
        
        // Find the time of the extreme value
        const timeAxis = fileData.data.time || [];
        const extremeIndex = values.indexOf(extreme);
        if (extremeIndex >= 0 && extremeIndex < timeAxis.length) {
          extremeTime = timeAxis[extremeIndex];
        }
      }
    }
  });
  
  const unit = fileData.metadata?.units?.[extremeSignal] || '';
  let response = `The ${isMax ? 'maximum' : 'minimum'} value I found is ${extremeValue.toFixed(2)}${unit ? ' ' + unit : ''} in the ${extremeSignal} signal at ${extremeTime.toFixed(2)}s.`;
  
  // Add details for other signals if there are multiple
  if (selectedSignals.length > 1) {
    response += ` Here are the ${isMax ? 'maximum' : 'minimum'} values for all selected signals:\n`;
    selectedSignals.forEach(signal => {
      if (extremeValues[signal] !== undefined) {
        const unit = fileData.metadata?.units?.[signal] || '';
        response += `\n- ${signal}: ${extremeValues[signal].toFixed(2)}${unit ? ' ' + unit : ''}`;
      }
    });
  }
  
  // Add suggestion to position cursor at extreme value
  response += `\n\nWould you like me to position the cursor at the ${isMax ? 'maximum' : 'minimum'} value? Just ask "Position cursor at ${isMax ? 'maximum' : 'minimum'} ${extremeSignal}".`;
  
  return response;
}

/**
 * Calculate average values for selected signals
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @returns {string} Analysis of average values
 */
function calculateAverageValues(fileData: FileData, selectedSignals: string[]): string {
  const avgValues: Record<string, number> = {};
  
  selectedSignals.forEach(signal => {
    const values = fileData.data[signal];
    if (values && Array.isArray(values)) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      avgValues[signal] = avg;
    }
  });
  
  let response = "Here are the average values for the selected signals:\n";
  selectedSignals.forEach(signal => {
    if (avgValues[signal] !== undefined) {
      const unit = fileData.metadata?.units?.[signal] || '';
      response += `\n- ${signal}: ${avgValues[signal].toFixed(2)}${unit ? ' ' + unit : ''}`;
    }
  });
  
  return response;
}

/**
 * Compare selected signals with min, max, and avg values
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @returns {string} Comparison of signals
 */
function compareSignals(fileData: FileData, selectedSignals: string[]): string {
  let response = "Here's a comparison of the selected signals:\n";
  
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
  
  return response;
}

/**
 * Position cursor at a specific value based on user request
 * @param {string} userMessage - The user's message
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @param {Object} cursors - Current cursor positions
 * @returns {Object} Response about cursor positioning with position information
 */
export function positionCursorAtValue(
  userMessage: string,
  fileData: FileData,
  selectedSignals: string[],
  cursors: { primaryCursor: CursorData; diffCursor: CursorData }
): { message: string; cursorPosition: { x: number; signal: string; value: number } } | string {
  // This function returns either a string or an object with positioning information
  // The actual positioning needs to be done in the component
  
  // Extract the signal name from the message
  let targetSignal = '';
  const normalizedMessage = userMessage.toLowerCase();
  
  for (const signal of selectedSignals) {
    if (normalizedMessage.includes(signal.toLowerCase())) {
      targetSignal = signal;
      break;
    }
  }
  
  // If no signal was found, use the first selected signal
  if (!targetSignal && selectedSignals.length > 0) {
    targetSignal = selectedSignals[0];
  }
  
  if (!targetSignal) {
    return "Please specify which signal you want to position the cursor for, or select a signal from the sidebar.";
  }
  
  // Check if we're looking for a maximum or minimum
  let isMax = false;
  let isMin = false;
  
  if (normalizedMessage.includes('max')) {
    isMax = true;
  } else if (normalizedMessage.includes('min')) {
    isMin = true;
  }
  
  if (isMax || isMin) {
    const values = fileData.data[targetSignal];
    if (values && Array.isArray(values)) {
      const timeAxis = fileData.data.time || [];
      
      let targetValue = 0;
      let targetTime = 0;
      
      if (isMax) {
        targetValue = Math.max(...values);
        const maxIndex = values.indexOf(targetValue);
        if (maxIndex >= 0 && maxIndex < timeAxis.length) {
          targetTime = timeAxis[maxIndex];
        }
      } else {
        targetValue = Math.min(...values);
        const minIndex = values.indexOf(targetValue);
        if (minIndex >= 0 && minIndex < timeAxis.length) {
          targetTime = timeAxis[minIndex];
        }
      }
      
      // Return information about where the cursor should be positioned
      // The actual positioning will be done in the component
      const unit = fileData.metadata?.units?.[targetSignal] || '';
      return {
        message: `I've positioned the primary cursor at ${targetTime.toFixed(2)}s where ${targetSignal} has a ${isMax ? 'maximum' : 'minimum'} value of ${targetValue.toFixed(2)}${unit ? ' ' + unit : ''}.`,
        cursorPosition: {
          x: targetTime,
          signal: targetSignal,
          value: targetValue
        }
      };
    }
  }
  
  return "I couldn't determine where to position the cursor. Please try specifying a signal and whether you want to position at its maximum or minimum value.";
}

/**
 * Calculate correlation between selected signals
 * @param {FileData} fileData - The current file data
 * @param {string[]} selectedSignals - Currently selected signals
 * @returns {string} Correlation analysis
 */
function calculateCorrelation(fileData: FileData, selectedSignals: string[]): string {
  if (selectedSignals.length < 2) {
    return "Please select at least two signals to analyze correlation.";
  }
  
  let response = "Here's a correlation analysis between the selected signals:\n";
  
  // Simple correlation calculation
  for (let i = 0; i < selectedSignals.length; i++) {
    for (let j = i + 1; j < selectedSignals.length; j++) {
      const signal1 = selectedSignals[i];
      const signal2 = selectedSignals[j];
      
      const values1 = fileData.data[signal1];
      const values2 = fileData.data[signal2];
      
      if (values1 && values2 && Array.isArray(values1) && Array.isArray(values2)) {
        // Use the shorter length
        const length = Math.min(values1.length, values2.length);
        
        // Calculate correlation coefficient (Pearson)
        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
        
        for (let k = 0; k < length; k++) {
          sum1 += values1[k];
          sum2 += values2[k];
          sum1Sq += values1[k] ** 2;
          sum2Sq += values2[k] ** 2;
          pSum += values1[k] * values2[k];
        }
        
        const num = pSum - (sum1 * sum2 / length);
        const den = Math.sqrt((sum1Sq - sum1 ** 2 / length) * (sum2Sq - sum2 ** 2 / length));
        
        const correlation = den === 0 ? 0 : num / den;
        
        // Interpret correlation
        let interpretation = "";
        if (correlation > 0.7) {
          interpretation = "Strong positive correlation";
        } else if (correlation > 0.3) {
          interpretation = "Moderate positive correlation";
        } else if (correlation > -0.3) {
          interpretation = "Weak or no correlation";
        } else if (correlation > -0.7) {
          interpretation = "Moderate negative correlation";
        } else {
          interpretation = "Strong negative correlation";
        }
        
        response += `\n- ${signal1} vs ${signal2}: ${correlation.toFixed(2)} (${interpretation})`;
      }
    }
  }
  
  return response;
}

/**
 * Process an AI query for signal operations
 * @param query The natural language query
 * @param availableSignals List of available signal names
 * @returns The AI query result with operations and explanation
 */
export async function processAIQuery(
  query: string,
  availableSignals: string[]
): Promise<AIQueryResult> {
  try {
    const response = await fetch('http://localhost:5000/api/process-ai-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        availableSignals
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return {
        operations: result.operations,
        explanation: result.explanation
      };
    } else {
      throw new Error(result.error || 'Unknown error processing AI query');
    }
  } catch (error) {
    console.error('Error processing AI query:', error);
    throw error;
  }
}

/**
 * Execute a signal operation
 * @param operation The operation to execute
 * @param signalsData The signals data
 * @returns The result of the operation
 */
export async function executeSignalOperation(
  operation: SignalOperation,
  signalsData: Record<string, number[]>
): Promise<DerivedSignal> {
  try {
    // Generate a meaningful name if outputName is undefined
    if (!operation.outputName || operation.outputName === 'undefined') {
      // Create a descriptive name based on the operation and signals
      switch (operation.operation) {
        case 'add':
          operation.outputName = `${operation.signals[0]}_plus_${operation.signals[1]}`;
          break;
        case 'subtract':
          operation.outputName = `${operation.signals[0]}_minus_${operation.signals[1]}`;
          break;
        case 'multiply':
          operation.outputName = `${operation.signals[0]}_times_${operation.signals[1]}`;
          break;
        case 'divide':
          operation.outputName = `${operation.signals[0]}_divided_by_${operation.signals[1]}`;
          break;
        case 'abs':
          operation.outputName = `abs_${operation.signals[0]}`;
          break;
        case 'scale':
          const factor = operation.parameters?.factor || 1;
          operation.outputName = `${operation.signals[0]}_scaled_${factor}`;
          break;
        case 'derivative':
          const order = operation.parameters?.order || 1;
          operation.outputName = `derivative${order}_${operation.signals[0]}`;
          break;
        case 'filter':
          const filterType = operation.parameters?.filter_type || 'lowpass';
          const cutoff = operation.parameters?.cutoff_freq || 0.1;
          operation.outputName = `${filterType}_filtered_${operation.signals[0]}`;
          break;
        case 'fft':
          operation.outputName = `fft_${operation.signals[0]}`;
          break;
        case 'stats':
          operation.outputName = `stats_${operation.signals[0]}`;
          break;
        default:
          operation.outputName = `processed_${operation.signals[0]}`;
      }
    }
    
    const response = await fetch('http://localhost:5000/api/process-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: operation.operation,
        signals: signalsData,
        signals_list: operation.signals,
        parameters: operation.parameters
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.result as DerivedSignal;
    } else {
      throw new Error(result.error || 'Unknown error executing signal operation');
    }
  } catch (error) {
    console.error('Error executing signal operation:', error);
    throw error;
  }
} 
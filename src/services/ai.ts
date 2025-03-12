/**
 * AI service for handling interactions with the AI backend
 */
import { processQuery } from './api';
import { getCurrentFile, FileData } from './file';
import { PlotData } from './visualization';
import { CursorData } from './visualization';

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
/**
 * AI service for handling interactions with the AI backend
 */
import { processQuery } from './api';
import { getCurrentFile } from './file';

export interface QueryResult {
  query: string;
  answer: string;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    sources?: string[];
    [key: string]: any;
  };
}

/**
 * Process a natural language query about the current file
 * @param {string} query - The natural language query
 * @returns {Promise<QueryResult>} The query result
 */
export async function processNaturalLanguageQuery(query: string): Promise<QueryResult> {
  const currentFile = getCurrentFile();
  
  if (!currentFile) {
    throw new Error('No file is currently loaded');
  }
  
  try {
    const result = await processQuery(query, currentFile.path);
    
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
 * Get suggested queries based on the current file
 * @returns {string[]} List of suggested queries
 */
export function getSuggestedQueries(): string[] {
  const currentFile = getCurrentFile();
  
  if (!currentFile) {
    return [];
  }
  
  // These are generic suggestions that could work for most measurement files
  return [
    'What are the main signals in this file?',
    'Show me the minimum and maximum values for each signal',
    'Are there any anomalies in the data?',
    'What is the sampling rate of this data?',
    'Summarize the key characteristics of this measurement',
    'What time periods show the most interesting behavior?',
    'Compare the relationship between signal A and signal B',
    'What patterns can you identify in this data?'
  ];
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